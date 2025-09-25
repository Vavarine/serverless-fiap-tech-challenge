#!/bin/bash

echo "🚀 Configurando projeto FIAP Tech Challenge - Autenticação CPF"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI não encontrado. Instale para usar deploy automático."
    echo "   Instruções: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
else
    echo "✅ AWS CLI encontrado"
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  Por favor, configure as variáveis no arquivo .env"
else
    echo "✅ Arquivo .env já existe"
fi

# Executar testes
echo "🧪 Executando testes..."
npm test

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis no arquivo .env"
echo "2. Configure os secrets no GitHub:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY" 
echo "   - AWS_REGION"
echo "   - JWT_SECRET_DEV"
echo "   - JWT_SECRET_PROD"
echo "3. Para testar localmente: npm run local"
echo "4. Para fazer deploy: npm run deploy"
echo ""
echo "📚 Documentação da API disponível em: API.md"