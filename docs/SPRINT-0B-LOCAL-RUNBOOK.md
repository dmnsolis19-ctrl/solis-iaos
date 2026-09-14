# SOLIS IAOS — Runbook local Sprint 0B

**Versión:** 0.2.0  
**Fecha:** 2026-07-26  
**Modo:** Local-first / AWS-ready  
**Datos autorizados:** Exclusivamente sintéticos

## 1. Objetivo

Este runbook valida Foundation en un computador local antes de comenzar Sprint

1. No conecta una planta, PLC, red OT ni datos reales y no ejecuta ningún
   despliegue AWS.

El cierre exige evidencia real de:

1. PostgreSQL 17, Mosquitto y SQS local saludables.
2. Migraciones aplicadas dos veces sin cambios en la segunda ejecución.
3. Checksums del ledger sin divergencia.
4. RLS forzada, roles sin `BYPASSRLS` y ataques cross-tenant bloqueados.
5. Cuatro imágenes construidas y ejecutadas como usuarios no root.
6. API, Worker, Simulator y Web saludables.
7. Correlation ID y trace ID propagados.
8. Terraform formateado e inicializado sin backend, con `validate` verde.
9. Trivy sin hallazgos HIGH/CRITICAL corregibles en fuente o imágenes.

## 2. Precondiciones

- Windows 11, macOS o Linux de 64 bits.
- Node.js 24 LTS.
- Docker Desktop o Docker Engine con Compose v2 iniciado.
- 8 GB de RAM disponible recomendada.
- Puertos `3000`, `3001`, `3002`, `5432`, `1883`, `4566` y `8080` libres.
- Conexión a Internet para obtener imágenes, proveedores Terraform y bases de
  vulnerabilidades.

No se requieren credenciales AWS, Terraform ni Trivy instalados.

## 3. Preparación inicial

Desde la raíz del proyecto:

```bash
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm install --frozen-lockfile
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

El archivo `.env` contiene únicamente valores locales de desarrollo y no debe
reutilizarse en staging o producción.

## 4. Ejecución

Primero:

```bash
pnpm sprint0b:preflight
```

Luego:

```bash
pnpm sprint0b
```

La ejecución completa puede tardar la primera vez porque Docker descarga las
imágenes y Trivy actualiza su base.

## 5. Evidencia

Cada ejecución crea:

```text
artifacts/sprint-0b/<fecha-hora>/
├── REPORT.md
├── summary.json
├── trivy-filesystem.json
├── trivy-image-api.json
├── trivy-image-telemetryWorker.json
├── trivy-image-simulator.json
├── trivy-image-web.json
└── NN-*.log
```

`artifacts/sprint-0b/LATEST` identifica la última ejecución.

El gate está verde solo cuando:

- `summary.json` contiene `"verdict": "PASS"`;
- todos los pasos están en `passed`;
- no se omitió ningún grupo del modo `all`;
- el commit o paquete validado conserva sus checksums.

## 6. Mantener la plataforma activa

Para validar y no detener los contenedores:

```bash
pnpm sprint0b -- --keep-running
```

Accesos:

| Servicio            | URL                                  |
| ------------------- | ------------------------------------ |
| Web                 | `http://localhost:8080`              |
| API readiness       | `http://localhost:3000/health/ready` |
| Worker readiness    | `http://localhost:3001/health/ready` |
| Simulator readiness | `http://localhost:3002/health/ready` |

Para un arranque posterior sin repetir todo el gate:

```bash
pnpm local:start
```

## 7. Detención y recuperación

Detener sin borrar PostgreSQL:

```bash
pnpm local:down
```

Ver diagnósticos:

```bash
pnpm local:logs
```

Borrar contenedores y volumen sintético:

```bash
pnpm local:reset
```

`local:reset` elimina todos los datos del PostgreSQL local de este proyecto.

## 8. Resolución de fallos

| Síntoma                 | Acción                                                                  |
| ----------------------- | ----------------------------------------------------------------------- |
| Docker no responde      | Abrir Docker Desktop y repetir `pnpm sprint0b:preflight`.               |
| Puerto ocupado          | Detener el proceso que usa el puerto; no cambiar contratos por omisión. |
| Migración con drift     | No editar una migración aplicada; crear una nueva migración versionada. |
| Falla RLS               | Bloquear Sprint 1 y corregir antes de continuar.                        |
| Trivy HIGH/CRITICAL     | Actualizar o mitigar con evidencia; no ignorar sin decisión registrada. |
| Terraform no valida     | Corregir HCL/proveedor; no ejecutar `apply`.                            |
| Health `503` del Worker | Revisar LocalStack y la cola `solis-telemetry`.                         |

## 9. Condición de salida

Sprint 0B queda técnicamente habilitado para revisión cuando el modo `all`
termina en `PASS`. Eso no autoriza todavía una conexión OT, datos reales,
control remoto ni AWS.
