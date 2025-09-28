# Deploy Manual - Sem GitHub Actions

## 🛠️ Pré-requisitos
1. AWS CLI configurado com suas credenciais
2. Serverless Framework instalado globalmente

## 📋 Passos para Deploy Manual

### 1. Instalar Serverless Framework
```powershell
npm install -g serverless
```

### 2. Configurar AWS CLI
```powershell
aws configure
# Insira: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
JWT_SECRET=seu-jwt-secret-atual
USER_POOL_ID=seu-user-pool-id
API_BASE_URL=https://provenly-nonrenouncing-josephine.ngrok-free.dev
JWT_ISS=cpf-auth
JWT_AUD=lanchonete-api
JWT_TTL_SECONDS=900
AWS_REGION=us-east-1
```

### 4. Deploy para Development
```powershell
serverless deploy --stage dev
```

### 5. Deploy para Production
```powershell
serverless deploy --stage prod
```

### 6. Testar o Deploy
Após o deploy, você receberá as URLs dos endpoints. Teste com:
```powershell
# Testar autenticação
curl -X POST https://sua-api-url/auth/cpf `
  -H "Content-Type: application/json" `
  -d '{"cpf": "12345678901"}'

# Testar proxy do carrinho (funcionalidade principal)
curl -X POST https://sua-api-url/carts `
  -H "Content-Type: application/json" `
  -d '{"cpf": "12345678901", "items": [{"id": "produto-1", "quantity": 2}]}'
```

## 🔧 Scripts Úteis
Adicionei scripts no package.json para facilitar:
- `npm run deploy` → Deploy para dev
- `npm run deploy:prod` → Deploy para produção
- `npm run local` → Executar localmente

## ⚠️ Notas Importantes
- Certifique-se de que suas credenciais AWS têm as permissões necessárias
- O USER_POOL_ID deve ser do mesmo Cognito que você usa atualmente
- O JWT_SECRET deve ser o mesmo do seu Lambda atual para manter compatibilidade