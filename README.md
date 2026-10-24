# SOLIS IAOS — V0.8 API de lectura e ingesta local

Esta entrega conecta el código de la API multiempresa y del consumidor de
telemetría con PostgreSQL, conservando las unidades y contratos existentes.
**Es un candidato local: no se ha certificado la compilación completa, el
PostgreSQL real ni un despliegue cloud.**

- Cinco endpoints GET: tenant, sitios, activos por sitio, detalle de activo y
  último valor. Autenticación Cognito RS256 y autorización por membership/sitio.
- Consumer LocalStack/SQS con Ajv, gateway/config/mapping, ledger idempotente,
  inserción batch, latest ordenado, ACK posterior al commit y visibilidad renovable.
- Migración 0003 para identidad MQTT explícita, hash, orden y particiones con RLS.
- Seed de dos empresas sintéticas, logins runtime separados y publicador/replay local.
- 180 pruebas nativas acumuladas, más pruebas de API/PostgreSQL pendientes de ejecución.

Los flags SOLIS_READ_API_ENABLED y SOLIS_INGESTION_ENABLED están apagados por
defecto. Solo aceptan development/test; el consumidor exige LocalStack. No hay
login web/PKCE, históricos, alarmas ni dashboard de producto en esta versión.

Comprobar sin descargar paquetes:

```bash
node tools/scripts/verify-saas-hardening.mjs
```

Continuar con [el runbook local](docs/saas-integration-v0.8/LOCAL-RUNBOOK.md),
[la decisión de integración](docs/saas-integration-v0.8/ADR-047-LOCAL-DOMAIN-INTEGRATION.md)
y [los resultados y límites](docs/saas-integration-v0.8/VALIDATION.md).
Los documentos de versiones anteriores se conservan como evidencia histórica.

---

## Historial: V0.7 Base de integración SaaS

Revisión de la rama `main` en `d4553c2961f2b1c5c899b8be76057199d88ac3ac`.
El ZIP suministrado coincide con los blobs del repositorio salvo finales de línea
CRLF/LF en cuatro scripts PowerShell. Esta entrega contiene mejoras locales;
no se ha publicado ni desplegado.

**Estado real:** Foundation + laboratorio sintético + sandbox IoT. Todavía no
es un SaaS integrado. La API/web y el worker mantienen su scaffold V0.2; los
contratos y las migraciones existentes se conservan sin cambios.

## Cambios V0.7

- Ejecutor de transacciones con tenant y rol locales, rechazo de logins
  privilegiados, límites de consulta y descarte de conexiones dañadas.
- Frontera de ingesta que coteja topic, client ID, gateway registrado y versión
  activa. Requiere un validador del JSON Schema canónico y una cola protegida.
- Primitiva de entrega que confirma el mensaje solo después del commit;
  los fallos quedan disponibles para retry/DLQ.
- API/worker Foundation devuelven readiness 503 en staging/producción hasta
  implementar y verificar las integraciones de producto. Liveness no cambia.
- Probe SQS con un intento y plazo de aborto de dos segundos.
- AWS IoT con `error_action` hacia la DLQ existente y trust IAM limitado a
  cuenta/regla. Es una modificación de código Terraform, no un cambio aplicado.
- Puertos publicados de ambos laboratorios enlazados a `127.0.0.1`.
- Pruebas nuevas sin paquetes externos, integradas antes de la instalación en CI.

Los módulos de transacción, frontera y entrega son **primitivas preparadas y
probadas de forma aislada**. Aún falta conectarlas al consumidor, al repositorio
PostgreSQL y a la validación de mappings. No activan ingesta por sí solas.

## Verificar esta entrega

Con Node.js 24 del proyecto, sin instalar paquetes:

```bash
node tools/scripts/verify-saas-hardening.mjs
```

Pruebas individuales:

```bash
node --test tools/tests/*.test.mjs
node tools/scripts/check-aws-iot-readiness.mjs
node tools/scripts/check-contract-sync.mjs
node tools/scripts/check-schema-sync.mjs
node tools/scripts/check-rls-sql.mjs
```

Las pruebas de API/PostgreSQL se ampliaron y requieren las dependencias e
infraestructura documentadas más abajo. La validación completa sigue siendo
`pnpm ci` y `pnpm sprint0b`; los tests anteriores no las reemplazan.

**Empezar por:** [revisión y plan SaaS](docs/saas-integration-v0.7/REVIEW-AND-PLAN.md),
[decisión local](docs/saas-integration-v0.7/ADR-046-SAAS-INTEGRATION-HARDENING.md),
[validación](docs/saas-integration-v0.7/VALIDATION.md) y
[runbook de errores IoT](docs/saas-integration-v0.7/IOT-ERROR-RECOVERY.md).

---

## V0.5 AWS IoT Readiness

V0.5 prepara de forma estática una ruta AWS IoT Core → SQS/DLQ con identidad
por gateway y mínimo privilegio. No usa credenciales, no crea certificados y no
ejecuta `plan` o `apply`. La pila aislada está en
`infra/terraform/iot-readiness` y su decisión en `docs/vertical-slice-v0.5/`.

Validación local de readiness:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\aws-iot-readiness.ps1
```

El laboratorio Docker V0.4 continúa siendo la prueba funcional local.

---

## V0.4 Vendor-Neutral Gateway Lab

V0.4 amplía la ruta funcional local con diez señales de proceso, calidad y
heartbeat del gateway. Mantiene el contrato MQTT v1 y prepara perfiles de
integración para WECON, Siemens, Mitsubishi, Schneider, Allen-Bradley y gateways
MQTT genéricos sin declarar compatibilidad física antes de FAT.

## Inicio rápido del MVP

Con Docker Desktop iniciado, abra PowerShell en la raíz y ejecute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-start.ps1
```

Después abra:

- Grafana: `http://localhost:3000/d/solis-gateway-lab-v040`
- Node-RED: `http://localhost:1880`
- InfluxDB: `http://localhost:8086`

Compruebe la ruta completa con:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-smoke.ps1
```

La decisión y el contrato de laboratorio están en `docs/vertical-slice-v0.4/`.

## Arquitectura V0.4

`Gateway Simulator → Mosquitto → Node-RED → InfluxDB → Grafana`

Esta ruta usa únicamente datos sintéticos. No autoriza todavía conexión con
PLC/red OT, Internet, control remoto ni AWS.

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
