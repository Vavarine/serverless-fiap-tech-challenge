# Script de setup para Windows PowerShell

Write-Host "🚀 Configurando projeto FIAP Tech Challenge - Autenticação CPF" -ForegroundColor Green

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion encontrado" -ForegroundColor Green
    
    # Verificar versão mínima
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "❌ Node.js versão 18+ é necessária. Versão atual: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

# Verificar se AWS CLI está instalado
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  AWS CLI não encontrado. Instale para usar deploy automático." -ForegroundColor Yellow
    Write-Host "   Instruções: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" -ForegroundColor Yellow
}

# Criar arquivo .env se não existir
if (!(Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Por favor, configure as variáveis no arquivo .env" -ForegroundColor Yellow
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

# Executar testes
Write-Host "🧪 Executando testes..." -ForegroundColor Yellow
npm test

Write-Host ""
Write-Host "🎉 Setup concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure as variáveis no arquivo .env"
Write-Host "2. Configure os secrets no GitHub:"
Write-Host "   - AWS_ACCESS_KEY_ID"
Write-Host "   - AWS_SECRET_ACCESS_KEY"
Write-Host "   - AWS_REGION"
Write-Host "   - JWT_SECRET_DEV"
Write-Host "   - JWT_SECRET_PROD"
Write-Host "3. Para testar localmente: npm run local"
Write-Host "4. Para fazer deploy: npm run deploy"
Write-Host ""
Write-Host "📚 Documentação da API disponível em: API.md" -ForegroundColor Cyan