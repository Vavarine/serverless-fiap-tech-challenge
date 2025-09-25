# Script para migrar o projeto para seu próprio repositório

Write-Host "🚀 Migrando projeto para seu repositório..." -ForegroundColor Green

# 1. Remover o remote atual
Write-Host "📤 Removendo remote atual..." -ForegroundColor Yellow
git remote remove origin

# 2. Instruções para criar novo repo
Write-Host ""
Write-Host "📋 INSTRUÇÕES:" -ForegroundColor Cyan
Write-Host "1. Acesse https://github.com/new" -ForegroundColor White
Write-Host "2. Crie um repositório chamado 'serverless-fiap-tech-challenge'" -ForegroundColor White
Write-Host "3. NÃO inicialize com README, .gitignore ou LICENSE" -ForegroundColor White
Write-Host "4. Copie a URL do repositório (ex: https://github.com/SEU-USUARIO/serverless-fiap-tech-challenge.git)" -ForegroundColor White
Write-Host ""

# 3. Solicitar URL do novo repo
$repoUrl = Read-Host "🔗 Cole a URL do seu novo repositório"

# 4. Adicionar novo remote
Write-Host "🔗 Adicionando novo remote..." -ForegroundColor Yellow
git remote add origin $repoUrl

# 5. Push inicial
Write-Host "📤 Fazendo push inicial..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "✅ Migração concluída!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Acesse seu repositório no GitHub" -ForegroundColor White
Write-Host "2. Vá em Settings > Secrets and variables > Actions" -ForegroundColor White
Write-Host "3. Configure os secrets conforme GITHUB_SECRETS.md" -ForegroundColor White
Write-Host "4. Faça um novo commit para testar o GitHub Actions" -ForegroundColor White