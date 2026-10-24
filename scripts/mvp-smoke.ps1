$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot

if (-not (Test-Path ".env.mvp")) { throw "Ejecute primero scripts/mvp-start.ps1." }

$Configuration = @{}
Get-Content ".env.mvp" | ForEach-Object {
    $Line = $_.Trim()
    if ($Line -and -not $Line.StartsWith("#")) {
        $Parts = $Line.Split("=", 2)
        if ($Parts.Count -eq 2) { $Configuration[$Parts[0]] = $Parts[1] }
    }
}

$InfluxPort = if ($Configuration["INFLUXDB_PORT"]) { $Configuration["INFLUXDB_PORT"] } else { "8086" }
$InfluxOrg = if ($Configuration["INFLUXDB_ORG"]) { $Configuration["INFLUXDB_ORG"] } else { "solis" }
$InfluxBucket = if ($Configuration["INFLUXDB_BUCKET"]) { $Configuration["INFLUXDB_BUCKET"] } else { "solis_telemetry" }
$InfluxToken = $Configuration["INFLUXDB_ADMIN_TOKEN"]
$TenantId = $Configuration["SOLIS_TENANT_ID"]
$GatewayId = $Configuration["SOLIS_GATEWAY_ID"]

if (-not $InfluxToken) { throw "INFLUXDB_ADMIN_TOKEN no está definido." }

$Headers = @{
    Authorization = "Token $InfluxToken"
    Accept = "application/csv"
    "Content-Type" = "application/vnd.flux"
}

$Query = "from(bucket: `"$InfluxBucket`") |> range(start: -5m) |> filter(fn: (r) => r._measurement == `"telemetry`") |> limit(n: 1)"
$Deadline = (Get-Date).AddSeconds(90)
$TelemetryFound = $false

while ((Get-Date) -lt $Deadline) {
    try {
        $Response = Invoke-RestMethod -Method Post -Uri "http://localhost:$InfluxPort/api/v2/query?org=$InfluxOrg" -Headers $Headers -Body $Query
        if ($Response -match "telemetry") {
            $TelemetryFound = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 3
        continue
    }
    Start-Sleep -Seconds 3
}

if (-not $TelemetryFound) { throw "No apareció telemetría en InfluxDB dentro de 90 segundos." }

$StatusQuery = "from(bucket: `"$InfluxBucket`") |> range(start: -5m) |> filter(fn: (r) => r._measurement == `"gateway_status`" and r._field == `"online`") |> last()"
$StatusResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:$InfluxPort/api/v2/query?org=$InfluxOrg" -Headers $Headers -Body $StatusQuery
if ($StatusResponse -notmatch "gateway_status") { throw "No apareció el heartbeat del gateway en InfluxDB." }

$VariableQuery = "from(bucket: `"$InfluxBucket`") |> range(start: -5m) |> filter(fn: (r) => r._measurement == `"telemetry`" and r._field == `"value_float64`") |> last()"
$VariableResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:$InfluxPort/api/v2/query?org=$InfluxOrg" -Headers $Headers -Body $VariableQuery
$ExpectedVariableIds = @(
    "d3cda2ec-dda5-405c-81a9-5312f18d86af",
    "de1baad0-2ab7-4a96-bf7e-69a8e62a0139",
    "abc70054-df38-494c-bb19-f9f559bc40b6",
    "82c76d55-834d-4d8b-ae7c-e7cb28dcedbc",
    "51fa768b-e3c1-4093-bf5d-f857a44a7d5a",
    "5df7dd7c-71f1-44a5-a2d5-497f0981acb9",
    "d5150fdc-7eea-46a4-93f2-1cd746a30ad2",
    "77717868-ada6-47df-bb9d-4162ab4fc396",
    "18b46d91-cff5-4784-9393-09d565ef49e8"
)
foreach ($VariableId in $ExpectedVariableIds) {
    if ($VariableResponse -notmatch [Regex]::Escape($VariableId)) {
        throw "No se observó la variable analógica $VariableId."
    }
}

$InvalidTopic = "solis/v1/tenants/$TenantId/gateways/$GatewayId/telemetry"
docker compose --env-file .env.mvp -f infra/mvp/compose.yaml exec -T mqtt mosquitto_pub -h 127.0.0.1 -p 1883 -q 1 -t $InvalidTopic -m '{"invalid":true}'
if ($LASTEXITCODE -ne 0) { throw "No fue posible publicar el mensaje negativo de prueba." }

Start-Sleep -Seconds 3
$RejectQuery = "from(bucket: `"$InfluxBucket`") |> range(start: -5m) |> filter(fn: (r) => r._measurement == `"ingestion_rejection`") |> limit(n: 1)"
$RejectResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:$InfluxPort/api/v2/query?org=$InfluxOrg" -Headers $Headers -Body $RejectQuery
if ($RejectResponse -notmatch "ingestion_rejection") { throw "El rechazo controlado no fue registrado." }

Write-Host "PASS: V0.4 almacenó telemetría multimagnitud, heartbeat y rechazo observable." -ForegroundColor Green
