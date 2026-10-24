$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker no está instalado o no está disponible en PATH."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop no está iniciado. Ábralo y vuelva a ejecutar este script."
}

if (-not (Test-Path ".env.mvp")) {
    Copy-Item ".env.mvp.example" ".env.mvp"
    Write-Host "Se creó .env.mvp con credenciales de desarrollo. Cámbielas antes de compartir el equipo." -ForegroundColor Yellow
}

docker compose --env-file .env.mvp -f infra/mvp/compose.yaml config --quiet
if ($LASTEXITCODE -ne 0) { throw "La configuración Docker Compose no es válida." }

docker compose --env-file .env.mvp -f infra/mvp/compose.yaml up -d --build --wait
if ($LASTEXITCODE -ne 0) {
    docker compose --env-file .env.mvp -f infra/mvp/compose.yaml logs --no-color --tail=200
    throw "El MVP no pudo iniciar correctamente."
}

docker compose --env-file .env.mvp -f infra/mvp/compose.yaml ps

Write-Host ""
Write-Host "SOLIS IAOS V0.4 está funcionando." -ForegroundColor Green
Write-Host "Grafana:  http://localhost:3000/d/solis-gateway-lab-v040"
Write-Host "Node-RED: http://localhost:1880"
Write-Host "InfluxDB: http://localhost:8086"
Write-Host "MQTT LAN: puerto 1883"
