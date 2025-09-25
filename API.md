# API Documentation

## Endpoints

### POST /auth/cpf
Autentica um usuário usando CPF (via Cognito) ou gera token anônimo.

**Request Body (com CPF):**
```json
{
  "cpf": "111.444.777-35"
}
```

**Request Body (anônimo):**
```json
{}
```

**Response Success (200):**
```json
{
  "message": "Autenticação realizada com sucesso",
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "payload": {
      "sub": "user-id-or-anonymous-id",
      "cpf": "11144477735",
      "iat": 1609459200,
      "exp": 1609460100,
      "iss": "cpf-auth",
      "aud": "lanchonete-api",
      "scope": "customer:authenticated"
    },
    "scope": "customer:authenticated"
  }
}
```

**Response Error (401):**
```json
{
  "message": "CPF não encontrado ou usuário desabilitado",
  "success": false
}
```

### POST /carts
Proxy para API de carrinho com autenticação automática.

**Request Body:**
```json
{
  "cpf": "111.444.777-35",
  "items": [
    {
      "id": "produto-1",
      "quantity": 2
    }
  ]
}
```

**Headers (opcional):**
```
Authorization: Bearer existing-jwt-token
```

**Response:** Retorna a resposta da API externa de carrinho.

### POST /auth/register
Registra um novo usuário.

**Request Body:**
```json
{
  "cpf": "111.444.777-35",
  "nome": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response Success (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "success": true,
  "data": {
    "cpf": "11144477735",
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

### GET /user/{cpf}
Busca informações de um usuário pelo CPF.

**Response Success (200):**
```json
{
  "message": "Usuário encontrado",
  "success": true,
  "data": {
    "cpf": "11144477735",
    "nome": "João Silva",
    "email": "joao@email.com",
    "createdAt": "2023-10-01T12:00:00.000Z"
  }
}
```

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação (CPF inválido, campos obrigatórios)
- `401` - Não autorizado (senha incorreta)
- `404` - Não encontrado
- `409` - Conflito (usuário já existe)
- `500` - Erro interno do servidor

## Autenticação

O token JWT retornado na autenticação deve ser usado no header `Authorization`:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O token expira em 24 horas.