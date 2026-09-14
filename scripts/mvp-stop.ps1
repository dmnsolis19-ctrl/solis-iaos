$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot

if (-not (Test-Path ".env.mvp")) {
    throw "No existe .env.mvp. La pila parece no haber sido inicializada."
}

docker compose --env-file .env.mvp -f infra/mvp/compose.yaml down
if ($LASTEXITCODE -ne 0) { throw "No fue posible detener la pila." }

Write-Host "Contenedores detenidos. Los datos permanecen en los volúmenes Docker." -ForegroundColor Green
