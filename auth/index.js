// ci/cd test

const crypto = require("crypto");

const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

// Helpers JWT simples (HS256)
function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signHS256(header, payload, secret) {
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${sig}`;
}

function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}

// Função para validar a autenticidade de um token JWT
function validateToken(token, secret) {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token não fornecido ou inválido' };
    }

    // Remove o prefixo "Bearer " se existir
    const cleanToken = token.replace(/^Bearer\s+/, '');

    // Divide o token em suas partes
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Formato de token inválido' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decodifica o header e payload
    let header, payload;
    try {
      header = JSON.parse(Buffer.from(headerB64, 'base64'));
      payload = JSON.parse(Buffer.from(payloadB64, 'base64'));
    } catch (e) {
      return { valid: false, error: 'Token malformado - erro na decodificação' };
    }

    // Verifica se o algoritmo é suportado
    if (header.alg !== 'HS256') {
      return { valid: false, error: 'Algoritmo não suportado' };
    }

    // Recalcula a assinatura
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Verifica se as assinaturas coincidem
    if (signatureB64 !== expectedSignature) {
      return { valid: false, error: 'Assinatura inválida' };
    }

    // Verifica se o token não está expirado
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expirado' };
    }

    // Verifica se o token já está ativo (nbf - not before)
    if (payload.nbf && payload.nbf > now) {
      return { valid: false, error: 'Token ainda não é válido' };
    }

    // Verifica o issuer se configurado
    if (JWT_ISS && payload.iss !== JWT_ISS) {
      return { valid: false, error: 'Issuer inválido' };
    }

    // Verifica a audience se configurada
    if (JWT_AUD && payload.aud !== JWT_AUD) {
      return { valid: false, error: 'Audience inválida' };
    }

    // Token válido
    return {
      valid: true,
      payload,
      header,
      error: null
    };

  } catch (error) {
    return { valid: false, error: `Erro na validação: ${error.message}` };
  }
}

const REGION = process.env.AWS_REGION || process.env.REGION || "us-east-1";
const USER_POOL_ID = process.env.USER_POOL_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISS = process.env.JWT_ISS || "cpf-auth";
const JWT_AUD = process.env.JWT_AUD || "lanchonete-api";
const EXP_SECONDS = parseInt(process.env.JWT_TTL_SECONDS || "900", 10);

const cognito = new CognitoIdentityProviderClient({ region: REGION });

exports.handler = async (event) => {
  try {
    // Se for uma requisição para validar token
    if (event.action === 'validate') {
      const token = event.token || event.headers?.Authorization || event.headers?.authorization;

      if (!token) {
        return {
          statusCode: 401,
          valid: false,
          message: "Token missing",
          customerId: null
        };
      }

      const validation = validateToken(token, JWT_SECRET);

      return {
        statusCode: validation.valid ? 200 : 401,
        valid: validation.valid,
        message: validation.error || "Valid token",
        customerId: validation.valid ? validation.payload.sub : null,
      };
    }

    const cpf = onlyDigits(event.cpf);

    let token = null;
    let payload = {}; // ✅ Declarar a variável payload

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
          message: "CPF not found or user disabled",
        };
      }

      const subAttr = user.Attributes?.find((a) => a.Name === "sub");
      const sub = subAttr ? subAttr.Value : user.Username;

      const now = Math.floor(Date.now() / 1000);

      payload = {
        sub,
        cpf,
        iat: now,
        exp: now + EXP_SECONDS,
        iss: JWT_ISS,
        aud: JWT_AUD,
        scope: "customer:authenticated",
      };
    } else {
      // Carrinho anônimo - gera token temporário
      const now = Math.floor(Date.now() / 1000);
      const anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // ✅ ID mais único

      payload = {
        sub: anonymousId,
        cpf: null,
        iat: now,
        exp: now + EXP_SECONDS,
        iss: JWT_ISS,
        aud: JWT_AUD,
        scope: "customer:anonymous",
      };
    }

    // Gera o token JWT
    token = signHS256({ alg: "HS256", typ: "JWT" }, payload, JWT_SECRET);

    const response = {
      statusCode: 200,
      message: "Success",
    };

    // Adiciona os dados necessários para a aplicação
    response.token = token; // Token JWT

    // Define customerId baseado no contexto
    if (cpf && cpf.length >= 11) {
      // Usuário autenticado - usa o sub do Cognito
      response.customerId = payload.sub;
    } else {
      // Usuário anônimo - customerId null
      response.customerId = null;
    }

    return response;
  } catch (err) {
    return {
      statusCode: 500,
      message: "Lambda error: " + err.message,
      error: err.message,
    };
  }
};

