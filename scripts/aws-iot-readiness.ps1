[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$stack = Join-Path $root "infra\terraform\iot-readiness"

Set-Location $root

if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    throw "Terraform no está disponible en PATH."
}

node .\tools\scripts\check-aws-iot-readiness.mjs
if ($LASTEXITCODE -ne 0) {
    throw "La validación estática AWS IoT falló."
}

Push-Location $stack
try {
    terraform fmt -check
    if ($LASTEXITCODE -ne 0) {
        throw "El formato Terraform no es válido."
    }

    terraform init -backend=false
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform init -backend=false falló."
    }

    terraform validate
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform validate falló."
    }
}
finally {
    Pop-Location
}

Write-Host "PASS: V0.6 AWS IoT readiness validado sin plan ni apply."
