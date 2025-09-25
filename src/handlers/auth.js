const AWS = require('aws-sdk');
const crypto = require('crypto');
const https = require('https');
const {
    CognitoIdentityProviderClient,
    ListUsersCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { validateCpf } = require('../utils/cpfValidator');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Configurações
const REGION = process.env.AWS_REGION || 'us-east-1';
const USER_POOL_ID = process.env.USER_POOL_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISS = process.env.JWT_ISS || 'cpf-auth';
const JWT_AUD = process.env.JWT_AUD || 'lanchonete-api';
const EXP_SECONDS = parseInt(process.env.JWT_TTL_SECONDS || '900', 10);
const API_BASE_URL = process.env.API_BASE_URL || 'https://provenly-nonrenouncing-josephine.ngrok-free.dev';

const cognito = new CognitoIdentityProviderClient({ region: REGION });

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Helpers JWT simples (HS256)
function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signHS256(header, payload, secret) {
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

function onlyDigits(s) {
  return (s || '').replace(/\D/g, '');
}

// Função para fazer chamada HTTP
function makeHttpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * Autentica usuário por CPF usando Cognito e gera token JWT
 * Baseado no Lambda original da AWS
 */
exports.authenticateCpf = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const cpf = onlyDigits(body.cpf);
    
    let token = null;
    let payload = {};
    
    // Se tem CPF, faz autenticação
    if (cpf && cpf.length >= 11) {
      // Consulta no Cognito pelo atributo custom:cpf
      const cmd = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Filter: `username = "${cpf}"`,
        Limit: 1,
      });
      const res = await cognito.send(cmd);
      const user = (res.Users || [])[0];

      if (!user || user.Enabled === false) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ 
            message: 'CPF não encontrado ou usuário desabilitado',
            success: false 
          }),
        };
      }

      const subAttr = user.Attributes?.find((a) => a.Name === 'sub');
      const sub = subAttr ? subAttr.Value : user.Username;

      const now = Math.floor(Date.now() / 1000);
      payload = {
        sub,
        cpf,
        iat: now,
        exp: now + EXP_SECONDS,
        iss: JWT_ISS,
        aud: JWT_AUD,
        scope: 'customer:authenticated',
      };
    } else {
      // Carrinho anônimo - gera token temporário
      const now = Math.floor(Date.now() / 1000);
      const anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      payload = {
        sub: anonymousId,
        cpf: null,
        iat: now,
        exp: now + EXP_SECONDS,
        iss: JWT_ISS,
        aud: JWT_AUD,
        scope: 'customer:anonymous',
      };
    }
    
    // Gera o token JWT
    token = signHS256({ alg: 'HS256', typ: 'JWT' }, payload, JWT_SECRET);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Autenticação realizada com sucesso',
        success: true,
        data: {
          token,
          payload,
          scope: payload.scope
        }
      })
    };

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Erro interno do servidor',
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

/**
 * Registra novo usuário
 */
exports.registerUser = async (event) => {
  try {
    const { cpf, nome, email, password } = JSON.parse(event.body);

    // Validar entrada
    if (!cpf || !nome || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Todos os campos são obrigatórios',
          success: false
        })
      };
    }

    // Validar CPF
    if (!validateCpf(cpf)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'CPF inválido',
          success: false
        })
      };
    }

    // Verificar se usuário já existe
    const existingUser = await dynamoDb.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { cpf }
    }).promise();

    if (existingUser.Item) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          message: 'Usuário já cadastrado com este CPF',
          success: false
        })
      };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salvar usuário
    const newUser = {
      cpf,
      nome,
      email,
      hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoDb.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: newUser
    }).promise();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Usuário criado com sucesso',
        success: true,
        data: {
          cpf: newUser.cpf,
          nome: newUser.nome,
          email: newUser.email
        }
      })
    };

  } catch (error) {
    console.error('Erro no registro:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Erro interno do servidor',
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

/**
 * Proxy para API de carrinho com autenticação
 * Replica a funcionalidade do Lambda original
 */
exports.cartProxy = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const cpf = onlyDigits(body.cpf);
    
    let token = null;
    let payload = {};
    
    // Se tem CPF, faz autenticação
    if (cpf && cpf.length >= 11) {
      // Consulta no Cognito pelo atributo custom:cpf
      const cmd = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Filter: `username = "${cpf}"`,
        Limit: 1,
      });
      const res = await cognito.send(cmd);
      const user = (res.Users || [])[0];

      if (!user || user.Enabled === false) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'CPF não encontrado ou usuário desabilitado' }),
        };
      }

      const subAttr = user.Attributes?.find((a) => a.Name === 'sub');
      const sub = subAttr ? subAttr.Value : user.Username;

      const now = Math.floor(Date.now() / 1000);
      payload = {
        sub,
        cpf,
        iat: now,
        exp: now + EXP_SECONDS,
        iss: JWT_ISS,
        aud: JWT_AUD,
        scope: 'customer:authenticated',
      };
    } else {
      // Carrinho anônimo - gera token temporário
      const now = Math.floor(Date.now() / 1000);
      const anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      payload = {
        sub: anonymousId,
        cpf: null,
        iat: now,
        exp: now + EXP_SECONDS,
        iss: JWT_ISS,
        aud: JWT_AUD,
        scope: 'customer:anonymous',
      };
    }
    
    // Gera o token JWT
    token = signHS256({ alg: 'HS256', typ: 'JWT' }, payload, JWT_SECRET);
    
    // Prepara o body para a API (remove cpf se for null/undefined)
    const bodyForAPI = { ...body };
    if (!cpf) {
      delete bodyForAPI.cpf; // Remove cpf se não existir
    }
    bodyForAPI.token = token; // Adiciona o token
    
    // Prepara a chamada para sua API
    const apiOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    };
    
    // Se já tem Authorization header (usuário já autenticado), usa ele
    if (event.headers?.Authorization || event.headers?.authorization) {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      apiOptions.headers['Authorization'] = authHeader;
      delete bodyForAPI.token; // Remove token do body se já está no header
    }
    
    // Chama sua API
    const apiResponse = await makeHttpRequest(
      `${API_BASE_URL}/carts`,
      apiOptions,
      JSON.stringify(bodyForAPI)
    );
    
    // Parse da resposta para objeto (se for JSON válido)
    let responseBody;
    try {
      responseBody = JSON.parse(apiResponse.body);
    } catch (e) {
      responseBody = { error: 'Invalid response from API', raw: apiResponse.body };
    }
    
    // Retorna a resposta da API
    return {
      statusCode: apiResponse.statusCode,
      headers,
      body: JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('Erro no proxy do carrinho:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Erro interno do servidor',
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

/**
 * Busca usuário por CPF no Cognito
 */
exports.getUserByCpf = async (event) => {
  try {
    const { cpf } = event.pathParameters;
    const cleanCpf = onlyDigits(cpf);

    if (!cleanCpf || cleanCpf.length !== 11) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'CPF inválido',
          success: false
        })
      };
    }

    // Consulta no Cognito
    const cmd = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `username = "${cleanCpf}"`,
      Limit: 1,
    });
    const res = await cognito.send(cmd);
    const user = (res.Users || [])[0];

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: 'Usuário não encontrado',
          success: false
        })
      };
    }

    // Extrair atributos do usuário
    const attributes = {};
    user.Attributes?.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Usuário encontrado',
        success: true,
        data: {
          cpf: cleanCpf,
          sub: attributes.sub,
          email: attributes.email,
          name: attributes.name,
          enabled: user.Enabled,
          status: user.UserStatus,
          createdAt: user.UserCreateDate,
          updatedAt: user.UserLastModifiedDate
        }
      })
    };

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Erro interno do servidor',
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};