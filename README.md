# Serverless FIAP Tech Challenge - Autenticação CPF

Este projeto contém o código de autenticação de CPF implementado como função Lambda na AWS, com deploy automático via GitHub Actions.

## Estrutura do Projeto

```
├── src/
│   ├── handlers/
│   │   └── auth.js          # Handler principal de autenticação
│   ├── utils/
│   │   └── cpfValidator.js  # Utilitários de validação de CPF
│   └── models/
│       └── user.js          # Modelos de dados
├── tests/
│   └── auth.test.js         # Testes unitários
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions para deploy
├── serverless.yml           # Configuração do Serverless Framework
└── package.json             # Dependências do projeto
```

## Configuração

### Pré-requisitos
- Node.js 18+
- AWS CLI configurado
- Serverless Framework

### Instalação
```bash
npm install
```

### Deploy Local
```bash
npm run deploy
```

### Testes
```bash
npm test
```

## GitHub Actions

O deploy é feito automaticamente quando há push na branch `main` ou `develop`.

### Secrets necessários no GitHub:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

## Endpoints

- `POST /auth/cpf` - Autenticação via CPF