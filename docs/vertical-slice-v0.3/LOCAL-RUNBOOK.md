# SOLIS IAOS V0.3 — guía local

## Requisitos

- Windows 10/11 de 64 bits;
- Docker Desktop con Docker Compose v2;
- 6 GB de RAM disponibles;
- puertos 1883, 1880, 3000 y 8086 libres.

No se requieren Node.js, pnpm, PostgreSQL, Terraform ni una cuenta AWS para
ejecutar este corte vertical.

## Inicio en Windows

Abra PowerShell en la raíz del proyecto y ejecute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-start.ps1
```

La primera ejecución crea `.env.mvp`. Sus claves son solo para laboratorio.
Antes de usar otro equipo en la red, edite ese archivo y cambie las contraseñas.

## Accesos

| Servicio              | Dirección                                      |
| --------------------- | ---------------------------------------------- |
| Grafana               | `http://localhost:3000/d/solis-telemetry-v030` |
| Node-RED              | `http://localhost:1880`                        |
| InfluxDB              | `http://localhost:8086`                        |
| MQTT para gateway LAN | `<IP-del-PC>:1883`                             |

Las credenciales se encuentran en `.env.mvp`. Este archivo está excluido de
Git.

## Prueba automática

Espere aproximadamente 20 segundos después del inicio y ejecute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-smoke.ps1
```

La prueba exige telemetría persistida y además publica un mensaje inválido para
comprobar que Node-RED lo rechaza y registra.

## Conectar un gateway de laboratorio

Use:

- host: dirección IPv4 del PC que ejecuta Docker;
- puerto: `1883`;
- usuario: valor `MQTT_USERNAME`;
- contraseña: valor `MQTT_PASSWORD`;
- QoS: `1`;
- topic:
  `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/telemetry`;
- payload: contrato `telemetry-envelope.v1.schema.json`.

El usuario externo solo puede publicar en los topics del tenant y gateway
configurados en `.env.mvp`; otros topics son rechazados por la ACL local.

Esta versión utiliza usuario y contraseña, pero todavía no TLS. Solo debe usarse
en una LAN de laboratorio confiable. La conexión por Internet permanece
prohibida hasta V0.4.

## Operación

Ver estado:

```powershell
docker compose --env-file .env.mvp -f infra/mvp/compose.yaml ps
```

Ver logs:

```powershell
docker compose --env-file .env.mvp -f infra/mvp/compose.yaml logs -f
```

Detener sin borrar datos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-stop.ps1
```

Reiniciar:

```powershell
docker compose --env-file .env.mvp -f infra/mvp/compose.yaml restart
```

## Borrado total del laboratorio

Este comando elimina permanentemente los volúmenes de InfluxDB, Grafana y
Mosquitto:

```powershell
docker compose --env-file .env.mvp -f infra/mvp/compose.yaml down -v --remove-orphans
```

No lo ejecute si necesita conservar la telemetría.

## No ejecutar simultáneamente

El stack Foundation utiliza el puerto `3000` para la API. No ejecute al mismo
tiempo `pnpm local:start` y el MVP V0.3 sin cambiar puertos explícitamente.
