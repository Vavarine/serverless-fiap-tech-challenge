# Configuração de Secrets no GitHub

Para que o GitHub Actions funcione corretamente, você precisa configurar os seguintes secrets no seu repositório GitHub.

## Como configurar os secrets:

1. Acesse seu repositório no GitHub
2. Vá em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione cada um dos secrets abaixo:

## Secrets necessários:

### AWS_ACCESS_KEY_ID
- **Descrição**: Access Key ID da sua conta AWS
- **Como obter**: 
  1. Acesse o AWS IAM Console
  2. Crie um usuário com permissões para Lambda, DynamoDB, CloudFormation, S3, IAM
  3. Gere as access keys
- **Exemplo**: `AKIAIOSFODNN7EXAMPLE`

### AWS_SECRET_ACCESS_KEY
- **Descrição**: Secret Access Key da sua conta AWS
- **Como obter**: Gerado junto com o Access Key ID
- **Exemplo**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

### AWS_REGION
- **Descrição**: Região AWS onde os recursos serão criados
- **Valor sugerido**: `us-east-1`
- **Outras opções**: `sa-east-1` (São Paulo), `us-west-2`, etc.

### JWT_SECRET_DEV
- **Descrição**: Chave secreta para JWT no ambiente de desenvolvimento
- **Como gerar**: Use um gerador de senhas seguras ou comando:
  ```bash
  openssl rand -base64 32
  ```
- **Exemplo**: `your-super-secret-jwt-key-for-development-32chars`

### JWT_SECRET_PROD
- **Descrição**: Chave secreta para JWT no ambiente de produção
- **Como gerar**: Use um gerador de senhas seguras diferente do desenvolvimento
- **Exemplo**: `your-super-secret-jwt-key-for-production-32chars`

### USER_POOL_ID_DEV
- **Descrição**: ID do User Pool do Cognito para desenvolvimento
- **Como obter**: AWS Console > Cognito > User Pools
- **Exemplo**: `us-east-1_AbCdEfGhI`

### USER_POOL_ID_PROD
- **Descrição**: ID do User Pool do Cognito para produção
- **Como obter**: AWS Console > Cognito > User Pools
- **Exemplo**: `us-east-1_XyZaBcDeF`

### API_BASE_URL_DEV
- **Descrição**: URL base da API externa para desenvolvimento
- **Exemplo**: `https://dev-api.example.com`

### API_BASE_URL_PROD
- **Descrição**: URL base da API externa para produção
- **Exemplo**: `https://api.example.com`

## Permissões IAM necessárias:

Crie uma policy com as seguintes permissões para o usuário do GitHub Actions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:*",
                "dynamodb:*",
                "iam:GetRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PassRole",
                "cloudformation:*",
                "s3:*",
                "apigateway:*",
                "logs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

## Verificação:

Após configurar todos os secrets, o GitHub Actions será executado automaticamente quando você fizer push para as branches `main` ou `develop`.

## Troubleshooting:

Se o deploy falhar, verifique:
1. Todos os secrets estão configurados corretamente
2. As credenciais AWS têm as permissões necessárias
3. A região AWS está correta
4. O JWT_SECRET tem pelo menos 32 caracteres