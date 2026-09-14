# Plan de implementación MVP V1.2

## Reglas

- Sprint 0A permite Sprint 0 Foundation bajo las condiciones del gate V1.2.
- Cada sprint produce un incremento demostrable.
- Seguridad, aislamiento, observabilidad y documentación no son sprints finales:
  forman parte de cada incremento.
- Los módulos diferidos no entran como “tareas pequeñas”.

## Secuencia

| Sprint | Objetivo | Resultado verificable |
|---:|---|---|
| 0A | Cierre de arquitectura | Gate aprobado |
| 0 | Plataforma base | Monorepo, CI, ambientes, observabilidad y migraciones |
| 1 | Identity & Control Plane | Dos tenants aislados con roles/scopes |
| 2 | Asset Core | Jerarquía, plantillas versionadas y variables |
| 3 | Connectivity & Simulator | Gateway activado, configuración y MQTT seguro |
| 4 | Telemetry | Ingesta idempotente, latest e histórico |
| 5 | Experience | Dashboard, activo y tendencias |
| 6 | Operations | Reglas, alarmas, acknowledgement y auditoría |
| 7 | Reporting & Hardening | CSV, reporte fijo, backup/restore y carga |
| 8 | Pilot Demo | Flujo end-to-end y aceptación |

## Sprint 0 — Plataforma base

Incluye:

- monorepo y convenciones;
- web, backend, worker y simulador vacíos pero ejecutables;
- PostgreSQL/broker para local;
- cola local compatible y DLQ;
- migraciones;
- OpenAPI/contratos como gates;
- CI/CD;
- secretos por ambiente;
- logging, métricas, trazas y correlation id;
- staging mínimo.

Salida:

- build reproducible;
- smoke test;
- migración adelante/compatibilidad;
- despliegue a staging;
- no contiene funciones de negocio.

## Sprint 1 — Identity & Control Plane

Incluye OIDC, tenant, membership, roles, site scopes, integrator delegation y
auditoría.

Salida:

- pruebas negativas entre dos tenants;
- retiro de membership efectivo;
- admin con MFA según proveedor;
- acceso de integrador limitado.

## Sprint 2 — Asset Core

Incluye site, area/system, asset, templates/version, variables y relaciones.

Salida:

- activo creado desde versión publicada;
- migración de plantilla explícita;
- referencias cross-tenant rechazadas;
- retiro preserva histórico lógico.

## Sprint 3 — Connectivity & Simulator

Incluye gateway lifecycle, mTLS, ACL, topics v1, configuration desired/reported,
LWT, buffer y simulador determinista.

Salida:

- alta y revocación;
- desconexión/replay;
- configuración inválida vuelve a la versión anterior;
- no existe topic de comandos.

## Sprint 4 — Telemetry

Incluye worker, schema validation, idempotencia, calidad, timestamps, latest,
histórico, retención inicial y métricas.

Salida:

- duplicados sin doble efecto;
- fuera de orden probado;
- rechazo observable;
- recuperación de worker;
- prueba de carga de baseline.

## Sprint 5 — Experience

Incluye navegación, dashboard de sitio, inventario, detalle de activo, estados
de calidad y tendencias agregadas.

Salida:

- desktop/tablet;
- reconexión segura;
- no se envían samples sin throttling;
- accesibilidad crítica validada.

## Sprint 6 — Operations

Incluye regla de umbral, histéresis, debounce, evento, alarma, transición,
acknowledgement, outbox y bandeja.

Salida:

- ciclo auditado;
- replay no duplica alarma;
- tormenta controlada;
- usuario fuera de scope rechazado.

## Sprint 7 — Reporting & Hardening

Incluye CSV, reporte fijo, backups, restore, runbooks, pruebas de seguridad,
capacidad y continuidad Edge.

Salida:

- restore demostrado;
- capacity envelope medido;
- SBOM y escaneos;
- runbooks operables.

## Sprint 8 — Pilot Demo

Incluye adaptador real prioritario y validación end-to-end en entorno piloto.

Salida:

- los siete criterios del Product Charter;
- incidentes críticos en cero;
- limitaciones documentadas;
- decisión Go/No-Go para beta.

## Dependencias críticas

- planta y protocolo antes de Sprint 3;
- OIDC antes de Sprint 1;
- RDS PostgreSQL nativo ya seleccionado; minor se fija en Sprint 0;
- AWS `sa-east-1` ya seleccionado para staging;
- roles antes de OpenAPI final;
- retención antes de carga y sizing.
