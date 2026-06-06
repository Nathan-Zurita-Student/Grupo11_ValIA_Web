# ================================================================
#  stop-mobile.ps1
#  Para o ngrok e restaura o .env.local para modo local.
#
#  Uso: .\stop-mobile.ps1
# ================================================================

$root = $PSScriptRoot

Write-Host ""
Write-Host " ================================== " -ForegroundColor Cyan
Write-Host "    ValIA - Parando modo mobile     " -ForegroundColor Cyan
Write-Host " ================================== " -ForegroundColor Cyan
Write-Host ""

# Restaura .env.local para localhost
Write-Host "Restaurando .env.local para localhost..." -ForegroundColor Yellow
$envFile = "$root\web\.env.local"
$envText  = Get-Content $envFile -Raw
$envText  = $envText -replace "NEXT_PUBLIC_API_URL=https://[^\r\n]*", "NEXT_PUBLIC_API_URL=http://localhost:3001/api"
Set-Content -Path $envFile -Value $envText.TrimEnd() -Encoding utf8
Write-Host "    OK - NEXT_PUBLIC_API_URL restaurada para localhost" -ForegroundColor DarkGray

# Remove arquivo auxiliar
$aux = "$root\.mobile-backend-url.txt"
if (Test-Path $aux) { Remove-Item $aux -Force }

# Para o ngrok
Write-Host "Parando ngrok..." -ForegroundColor Yellow
$ngrokProcs = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcs) {
    $ngrokProcs | Stop-Process -Force
    Write-Host "    OK - ngrok encerrado" -ForegroundColor DarkGray
} else {
    Write-Host "    ngrok nao estava rodando" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host " Pronto! Ambiente local restaurado." -ForegroundColor Green
Write-Host " Feche as janelas do backend e frontend manualmente." -ForegroundColor DarkGray
Write-Host ""
Read-Host "Pressione Enter para sair"
