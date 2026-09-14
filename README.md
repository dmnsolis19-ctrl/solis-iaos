# SOLIS IAOS — V0.3 Telemetry Vertical Slice

V0.3 agrega una ruta rápida y funcional de telemetría local sobre la Foundation
V0.2.0. La arquitectura empresarial original permanece disponible y sin
reemplazo.

## Inicio rápido del MVP

Con Docker Desktop iniciado, abra PowerShell en la raíz y ejecute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-start.ps1
```

Después abra:

- Grafana: `http://localhost:3000/d/solis-telemetry-v030`
- Node-RED: `http://localhost:1880`
- InfluxDB: `http://localhost:8086`

Compruebe la ruta completa con:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-smoke.ps1
```

La guía completa está en `docs/vertical-slice-v0.3/LOCAL-RUNBOOK.md` y la
decisión de alcance en `docs/vertical-slice-v0.3/ADR-042-LOCAL-TELEMETRY-VERTICAL-SLICE.md`.

## Arquitectura V0.3

`Gateway Simulator → Mosquitto → Node-RED → InfluxDB → Grafana`

Esta ruta usa únicamente datos sintéticos. No autoriza PLC, OT, Internet,
control remoto ni AWS.

---

## Baseline V0.2.0

Incremento local-first/AWS-ready de la plataforma SOLIS IAOS, compatible con
Foundation V0.1.0 y la Baseline arquitectónica V1.2.

## Alcance

Este incremento conserva FND-01 a FND-10 y añade el cierre reproducible de
Sprint 0B:

- monorepo con límites verificables;
- runtimes y dependencias fijados;
- PostgreSQL, MQTT y SQS emulado para desarrollo local;
- migraciones versionadas, idempotencia y checksums;
- pruebas RLS positivas y negativas entre dos tenants;
- cuatro imágenes de aplicación no root y con filesystem de solo lectura;
- health checks de API, Worker, Simulator y Web;
- correlación y trace ID E2E;
- Terraform y Trivy ejecutables mediante imágenes Docker fijadas;
- runner único con evidencia JSON, Markdown y logs;
- CI, contratos, observabilidad y seguridad;
- landing zone Terraform para staging;
- despliegue por digest preparado.

No implementa identidad, activos, conectividad industrial, ingesta funcional,
alarmas ni reportes. Esos incrementos pertenecen a Sprint 1+.

## Requisitos

- Node.js 24.18.0 LTS;
- Corepack y pnpm 11.17.0;
- Docker Desktop/Engine con Compose v2;
- 8 GB de RAM disponibles recomendados para las validaciones;
- conexión a Internet para descargar imágenes y bases de vulnerabilidades.

No se requiere instalar Terraform ni Trivy en el equipo: Sprint 0B los ejecuta
en contenedores fijados. No se requieren cuenta ni credenciales AWS.

## Instalación

```bash
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
```

En PowerShell, copie el archivo de entorno con:

```powershell
Copy-Item .env.example .env
```

## Validación completa Sprint 0B

Con Docker Desktop abierto:

```bash
pnpm sprint0b:preflight
pnpm sprint0b
```

El runner valida calidad, contratos, migraciones, RLS, servicios, imágenes,
trazas, Terraform y seguridad. Al finalizar detiene los contenedores, pero
conserva el volumen PostgreSQL. La evidencia queda en
`artifacts/sprint-0b/<ejecución>/`.

Para mantener la plataforma encendida después de validar:

```bash
pnpm sprint0b -- --keep-running
```

## Uso local diario

```bash
pnpm local:start
```

La infraestructura utiliza exclusivamente datos sintéticos. Servicios:

- Web en contenedor: `http://localhost:8080`
- API: `3000`
- Worker health: `3001`
- Simulator health: `3002`
- PostgreSQL: `5432`
- MQTT: `1883`
- LocalStack/SQS: `4566`

Para revisar estado, logs y detener:

```bash
docker compose -f infra/local/compose.yaml --profile apps ps
pnpm local:logs
pnpm local:down
```

`pnpm local:reset` también elimina el volumen PostgreSQL local y solo debe
usarse cuando se quiera borrar todos los datos sintéticos.

## Gates

- Sprint 0B solo puede declararse cerrado con una ejecución `pnpm sprint0b`
  cuyo `summary.json` indique `PASS`.
- Sprint 1, OT, datos reales y AWS permanecen bloqueados hasta revisar la
  evidencia local.
- El despliegue futuro a staging requiere cuenta AWS, OIDC, DNS, certificado,
  presupuesto y aprobación de un plan Terraform.

Consulte `docs/SPRINT-0B-LOCAL-RUNBOOK.md` y
`docs/SPRINT-0B-VALIDATION-REPORT.md`.
