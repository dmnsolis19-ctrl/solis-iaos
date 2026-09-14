# SOLIS IAOS — Informe Sprint 0B

**Versión:** 0.2.0  
**Fecha de corte:** 2026-07-26  
**Baseline:** Arquitectura V1.2 + Foundation V0.1.0  
**Alcance:** Validación local reproducible, datos sintéticos

## Resumen

Sprint 0B transforma los controles pendientes de Foundation en un gate local
ejecutable mediante un único comando. El incremento no agrega funcionalidad de
negocio y mantiene el monolito modular, Telemetry Worker separado por carga,
PostgreSQL, MQTT industrial, Docker sin Kubernetes y ausencia de control
remoto.

## Cambios implementados

| Área           | Mejora                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Build          | `.dockerignore` para excluir dependencias, builds, documentación y secretos locales.                  |
| Runtime        | Imágenes locales identificables, usuarios no root, `no-new-privileges` y filesystem de solo lectura.  |
| Base de datos  | `.env` cargable por CLI, doble migración, ledger y checksum verificables.                             |
| Multi-tenant   | RLS forzada, políticas presentes, contexto transaccional y pruebas negativas de insert/update/delete. |
| Dependencias   | Smoke TCP de PostgreSQL, handshake MQTT 3.1.1 y estado SQS.                                           |
| Aplicaciones   | Health checks de cuatro unidades y validación de versión.                                             |
| Observabilidad | Correlation ID y trace ID E2E registrados como evidencia.                                             |
| IaC            | Terraform 1.15.8 ejecutado en contenedor, sin backend ni `apply`.                                     |
| Seguridad      | Trivy 0.69.3 para filesystem/IaC y cuatro imágenes.                                                   |
| Operación      | Runner por modos, logs, resumen JSON, informe Markdown y runbook.                                     |

## Controles disponibles

| Comando                   | Alcance                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm sprint0b:preflight` | Node, pnpm, Docker Engine y Compose.                                               |
| `pnpm sprint0b:static`    | Formato, lint, tipos, contratos, pruebas unitarias, build, secretos, audit y SBOM. |
| `pnpm sprint0b:local`     | Dependencias, migraciones, RLS, imágenes, no-root, health y trace.                 |
| `pnpm sprint0b:terraform` | `fmt`, `init -backend=false` y `validate`.                                         |
| `pnpm sprint0b:security`  | Trivy filesystem/IaC e imágenes.                                                   |
| `pnpm sprint0b`           | Gate completo en orden.                                                            |

## Estado de validación en el entorno de construcción

La validación estática se ejecuta y se adjunta en este paquete. Docker,
PostgreSQL, Terraform y Trivy no están disponibles en el entorno de
construcción de ChatGPT Work; por tanto, la evidencia dinámica debe generarse
en el computador local mediante `pnpm sprint0b`.

No se declara `PASS` dinámico sin esa ejecución.

## Dictamen

El paquete queda **listo para ejecutar Sprint 0B local**, pero Sprint 0B solo
se considerará cerrado cuando `artifacts/sprint-0b/<ejecución>/summary.json`
indique `PASS`.

Hasta entonces se mantiene **NO-GO para Sprint 1, AWS, OT, datos reales y
control remoto**.
