# Runbook local — Gateway Lab V0.4

protocolo, direccionamiento, responsable OT y plan FAT de solo lectura.

## Propósito

Validar telemetría multimagnitud, calidad y heartbeat con datos sintéticos.
Este procedimiento no conecta un PLC ni autoriza acceso OT.

## Inicio

Desde PowerShell en la raíz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-start.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-smoke.ps1
```

Resultado esperado:

```text
PASS: V0.4 almacenó telemetría multimagnitud, heartbeat y rechazo observable.
```

Abrir Grafana en `http://localhost:3000/d/solis-gateway-lab-v040`.

## Perfil de laboratorio

`SOLIS_GATEWAY_PROFILE=wecon-h-ag` identifica el escenario simulado. No implica
que exista comunicación con hardware. Los perfiles disponibles se documentan
en `profiles/gateway-profiles.json`.

## Detención

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-stop.ps1
```

## Gate de hardware

No conectar un PLC hasta disponer de mapa de tags/registros, firmware,
protocolo, direccionamiento, responsable OT y plan FAT de solo lectura.
