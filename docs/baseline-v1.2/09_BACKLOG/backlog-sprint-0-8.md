# Backlog Sprint 0–8

## Resumen

| Sprint | Objetivo | Historias | Puntos |
|---:|---|---:|---:|
| 0 | Foundation | 10 | 55 |
| 1 | Identity & Control Plane | 8 | 42 |
| 2 | Asset Core | 8 | 42 |
| 3 | Connectivity & Simulator | 9 | 55 |
| 4 | Telemetry | 10 | 63 |
| 5 | Experience | 8 | 42 |
| 6 | Operations | 9 | 52 |
| 7 | Reporting & Hardening | 9 | 50 |
| 8 | Pilot Demo | 6 | 34 |
|  | **Total** | **77** | **435** |

No se debe prometer una fecha usando 435 puntos sin medir la velocidad del
equipo durante Sprint 0 y 1.

## Sprint 0 — Foundation

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| FND-01 | Crear monorepo y límites de apps/packages | 5 | Gate | build limpio |
| FND-02 | Fijar runtime y lockfiles soportados | 3 | ADR | SBOM inicial |
| FND-03 | Levantar PostgreSQL/broker/cola local | 5 | contratos | smoke local |
| FND-04 | Implementar migraciones desde DDL v1 | 8 | DATA | migrate/rollback compatible |
| FND-05 | Crear CI con lint/type/unit/integration | 5 | repo | pipeline verde |
| FND-06 | Validar OpenAPI y JSON Schema en CI | 5 | CONTRACTS | diff compatible |
| FND-07 | Instrumentar logs/correlation/OTel | 5 | OBS | trace E2E |
| FND-08 | Terraform landing zone nonprod | 8 | AWS cuenta | plan revisado |
| FND-09 | Deploy vacío a staging por digest | 8 | FND-08 | smoke staging |
| FND-10 | Scans de secretos/deps/imagen y SBOM | 3 | CI | gates activos |

## Sprint 1 — Identity & Control Plane

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| IAM-01 | Integrar Cognito OIDC | 5 | OIDC config | login/logout |
| IAM-02 | Validar tokens, issuer, audience y clock | 5 | IAM-01 | negative tests |
| IAM-03 | Crear tenant y membership | 5 | migraciones | API+audit |
| IAM-04 | Implementar roles/permisos | 8 | matriz auth | suite por rol |
| IAM-05 | Implementar site scope | 5 | IAM-04 | A1 no ve A2 |
| IAM-06 | Delegar integrador con vigencia | 5 | IAM-05 | expiry/revoke |
| IAM-07 | Forzar MFA admin y evidencia federada | 5 | Cognito | admin test |
| IAM-08 | Ejecutar suite RLS concurrente | 4 | RLS | cero fugas |

## Sprint 2 — Asset Core

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| AST-01 | CRUD site/area | 5 | IAM | OpenAPI |
| AST-02 | Plantilla y versión draft | 5 | AST-01 | invariantes |
| AST-03 | Publicar versión inmutable | 5 | AST-02 | mutation denied |
| AST-04 | Crear asset desde versión | 8 | AST-03 | variables atómicas |
| AST-05 | Gestionar variable tipo/unidad | 5 | diccionario | mismatch tests |
| AST-06 | Relaciones parent/related tenant-aware | 5 | AST-04 | FK negative |
| AST-07 | Retirar asset sin perder histórico | 5 | AST-04 | retirement test |
| AST-08 | Importación inicial validada | 4 | AST-05 | reporte errores |

## Sprint 3 — Connectivity & Simulator

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| CON-01 | Lifecycle gateway | 5 | IAM/AST | estados auditados |
| CON-02 | Activación de un uso y CSR/key local | 8 | PKI | sin private key cloud |
| CON-03 | IoT policy por gateway | 5 | AWS IoT | ACL negativos |
| CON-04 | Simulator determinista | 8 | schemas | escenarios reproducibles |
| CON-05 | Buffer SQLite WAL | 8 | Edge runtime | 24 h simulado |
| CON-06 | Publisher QoS1/backoff/jitter | 5 | IoT | reconnect |
| CON-07 | Config desired/reported atómica | 8 | config schemas | rollback |
| CON-08 | Status/LWT/diagnostics | 5 | schemas | retained/expiry |
| CON-09 | Revocación y rotación | 3 | PKI | efecto <5 min |

## Sprint 4 — Telemetry

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| TEL-01 | IoT Rule a SQS/DLQ | 5 | topology | delivery test |
| TEL-02 | Worker consume por lotes | 8 | TEL-01 | bounded concurrency |
| TEL-03 | Resolver identidad confiable | 5 | PKI | mismatch reject |
| TEL-04 | Validar schema/tipo/unidad/mapping | 8 | contracts | rejection codes |
| TEL-05 | Dedupe envelope/sample | 8 | DDL | replay no duplica |
| TEL-06 | Persistir raw particionado | 8 | partitions | CAP-01 |
| TEL-07 | Proyección latest determinista | 5 | TEL-06 | out-of-order |
| TEL-08 | Agregados 1m/1h | 8 | TEL-06 | late recalculation |
| TEL-09 | Retención observable | 5 | policy | detach audit |
| TEL-10 | Métricas, DLQ y redrive | 3 | OBS | incident drill |

## Sprint 5 — Experience

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| UX-01 | Shell, tenant/site selector | 5 | IAM | no mixed tenant |
| UX-02 | Inventario paginado | 5 | AST | loading/error/empty |
| UX-03 | Vista de activo y variables | 5 | AST | tablet |
| UX-04 | Dashboard de sitio | 8 | latest | status states |
| UX-05 | Histórico con auto-resolución | 8 | aggregates | ≤2.000 points |
| UX-06 | Canal realtime scoped | 5 | auth | unauthorized denied |
| UX-07 | Accesibilidad crítica | 3 | UI | teclado/contraste |
| UX-08 | Stale/offline/bad/no-data | 3 | dictionary | no solo color |

## Sprint 6 — Operations

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| OPS-01 | CRUD regla de umbral | 5 | auth | scope tests |
| OPS-02 | Histéresis y deadband | 5 | OPS-01 | boundary tests |
| OPS-03 | Debounce persistente | 8 | telemetry | restart test |
| OPS-04 | Apertura/dedupe de alarma | 8 | OPS-02 | replay safe |
| OPS-05 | Ciclo y transición atómica | 8 | OPS-04 | state matrix |
| OPS-06 | Acknowledgement autorizado | 5 | OPS-05 | actor/comment |
| OPS-07 | Outbox de eventos | 5 | DDL | retry |
| OPS-08 | Bandeja/detalle alarmas | 5 | UX | 1.000 alarms |
| OPS-09 | Tormenta y observabilidad | 3 | OBS | bounded load |

## Sprint 7 — Reporting & Hardening

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| REP-01 | Export CSV por job | 5 | telemetry | scope/quota |
| REP-02 | Reporte operacional PDF fijo | 8 | operations | golden sample |
| REP-03 | URL firmada y expiración | 3 | object store | access test |
| SEC-01 | Pentest tenancy/auth/API | 8 | MVP flow | findings |
| DR-01 | Backup/PITR/restore drill | 8 | prod-like | RPO/RTO |
| CAP-01A | Carga sostenida y pico | 8 | telemetry | report |
| OPS-10 | Ejecutar runbooks/tabletop | 5 | owners | evidence |
| SEC-02 | Hardening Edge final | 3 | device | checklist |
| GOV-01 | Revisión licencias/SBOM | 2 | artifacts | approval |

## Sprint 8 — Pilot Demo

| ID | Historia | SP | Dependencia | Evidencia |
|---|---|---:|---|---|
| PIL-01 | Adaptador Modbus TCP/RTU real | 8 | planta | FAT |
| PIL-02 | Commissioning gateway/site | 5 | PIL-01 | checklist |
| PIL-03 | Prueba pérdida/replay | 5 | connectivity | no loss in buffer |
| PIL-04 | Flujo alarma y auditoría | 5 | operations | SAT |
| PIL-05 | Aislamiento dos tenants | 3 | IAM/RLS | negative demo |
| PIL-06 | Aceptación y Go/No-Go beta | 8 | all | acta firmada |

## Camino crítico

`Gate → AWS/OIDC → Migraciones/RLS → Asset Core → PKI/MQTT → Telemetry →
Operations → Hardening → Pilot`

El frontend puede avanzar con mocks contractuales desde Sprint 2, pero no debe
inventar endpoints fuera de OpenAPI.

