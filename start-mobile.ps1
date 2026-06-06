# ================================================================
#  start-mobile.ps1
#  Inicia backend + ngrok (2 tuneis) + frontend automaticamente,
#  atualiza .env.local com a URL publica do backend e exibe o
#  link para abrir no celular.
#
#  Uso: clique com botao direito → "Run with PowerShell"
#        ou: .\start-mobile.ps1
# ================================================================

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Clear-Host
Write-Host ""
Write-Host " ================================== " -ForegroundColor Cyan
Write-Host "    ValIA - Modo Mobile             " -ForegroundColor Cyan
Write-Host " ================================== " -ForegroundColor Cyan
Write-Host ""

# ── Passo 1: Configura o ngrok ──────────────────────────────
Write-Host "[1/5] Configurando ngrok..." -ForegroundColor Yellow

# Detecta caminho do config (ngrok v3 ou v2)
$cfgPaths = @(
    "$env:LOCALAPPDATA\ngrok\ngrok.yml",
    "$env:HOMEPATH\.ngrok2\ngrok.yml"
)
$cfgFile = $cfgPaths[0]
foreach ($p in $cfgPaths) { if (Test-Path $p) { $cfgFile = $p; break } }

# Garante que o diretorio existe
$cfgDir = Split-Path $cfgFile
if (-not (Test-Path $cfgDir)) {
    New-Item -ItemType Directory -Force -Path $cfgDir | Out-Null
}

# Le o authtoken existente (preserva o token ja configurado)
$authToken = ""
if (Test-Path $cfgFile) {
    $raw = Get-Content $cfgFile -Raw -ErrorAction SilentlyContinue
    if ($raw -match "authtoken:\s*([^\r\n]+)") {
        $authToken = $matches[1].Trim()
    }
}

if (-not $authToken) {
    Write-Host ""
    Write-Host "  ERRO: Token do ngrok nao encontrado." -ForegroundColor Red
    Write-Host ""
    Write-Host "  1. Crie uma conta gratuita em: https://ngrok.com" -ForegroundColor White
    Write-Host "  2. Copie seu token em: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "  3. Execute no terminal: ngrok authtoken SEU_TOKEN" -ForegroundColor White
    Write-Host "  4. Rode este script novamente." -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Escreve config com os dois tuneis
$cfgContent = @"
version: "2"
authtoken: $authToken
tunnels:
  backend:
    proto: http
    addr: 3001
  frontend:
    proto: http
    addr: 3000
"@
Set-Content -Path $cfgFile -Value $cfgContent -Encoding utf8
Write-Host "    OK - config em: $cfgFile" -ForegroundColor DarkGray

# ── Passo 2: Inicia o backend ───────────────────────────────
Write-Host "[2/5] Iniciando backend (porta 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "& { `$host.UI.RawUI.WindowTitle = 'ValIA - Backend'; Write-Host 'BACKEND iniciado' -ForegroundColor Green; Set-Location '$root\backend'; npm start }"
Start-Sleep -Seconds 2

# ── Passo 3: Inicia o ngrok ─────────────────────────────────
Write-Host "[3/5] Iniciando ngrok (2 tuneis)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "& { `$host.UI.RawUI.WindowTitle = 'ValIA - Ngrok'; Write-Host 'NGROK iniciado' -ForegroundColor Green; ngrok start --all }"

# ── Passo 4: Aguarda ngrok e le as URLs ─────────────────────
Write-Host "[4/5] Aguardando ngrok ficar pronto" -ForegroundColor Yellow

$backendUrl  = ""
$frontendUrl = ""

for ($i = 1; $i -le 30; $i++) {
    Start-Sleep -Seconds 1
    Write-Host "    Tentativa $i/30..." -ForegroundColor DarkGray -NoNewline
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        foreach ($t in $res.tunnels) {
            $url  = $t.public_url
            $addr = $t.config.addr
            if ($url -notmatch "^https://") { continue }   # so HTTPS
            if ($addr -match ":3001") { $backendUrl  = $url }
            if ($addr -match ":3000") { $frontendUrl = $url }
        }
        if ($backendUrl -and $frontendUrl) {
            Write-Host " pronto!" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host ""
}

if (-not $backendUrl -or -not $frontendUrl) {
    Write-Host ""
    Write-Host "  ERRO: nao foi possivel obter as URLs do ngrok." -ForegroundColor Red
    Write-Host "  Verifique se o ngrok esta autenticado e tente novamente." -ForegroundColor Red
    Read-Host "  Pressione Enter para sair"
    exit 1
}

Write-Host "    Backend:  $backendUrl" -ForegroundColor DarkGray
Write-Host "    Frontend: $frontendUrl" -ForegroundColor DarkGray

# ── Passo 5: Atualiza .env.local e inicia frontend ──────────
Write-Host "[5/5] Atualizando .env.local e iniciando frontend..." -ForegroundColor Yellow

$envFile = "$root\web\.env.local"
$envText  = Get-Content $envFile -Raw
$envText  = $envText -replace "NEXT_PUBLIC_API_URL=[^\r\n]*", "NEXT_PUBLIC_API_URL=$backendUrl/api"
Set-Content -Path $envFile -Value $envText.TrimEnd() -Encoding utf8

# Salva a URL do backend num arquivo auxiliar para o stop-mobile restaurar depois
"$backendUrl" | Out-File "$root\.mobile-backend-url.txt" -Encoding utf8

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "& { `$host.UI.RawUI.WindowTitle = 'ValIA - Frontend'; Write-Host 'FRONTEND iniciado' -ForegroundColor Green; Set-Location '$root\web'; npm run dev }"

# ── Resultado ────────────────────────────────────────────────
Write-Host ""
Write-Host " ============================================ " -ForegroundColor Green
Write-Host "   Tudo pronto!                              " -ForegroundColor Green
Write-Host ""
Write-Host "   Abra no celular:" -ForegroundColor White
Write-Host ""
Write-Host "   $frontendUrl" -ForegroundColor Black -BackgroundColor Green
Write-Host ""
Write-Host "   (aguarde ~10s o Next.js terminar de subir)" -ForegroundColor DarkGray
Write-Host " ============================================ " -ForegroundColor Green
Write-Host ""
Write-Host "  Quando terminar: .\stop-mobile.ps1" -ForegroundColor DarkGray
Write-Host ""
Read-Host "Pressione Enter para fechar esta janela (os servicos continuam rodando)"
