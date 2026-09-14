# Observabilidad, SLI y alertas

## Principios

- logs estructurados JSON;
- UTC;
- correlation ID extremo a extremo;
- OpenTelemetry en API, jobs y worker;
- métricas por tenant solo como dimensión controlada;
- no incluir secretos, tokens o payloads completos;
- dashboard no reemplaza alerta accionable.

## SLO internos

| Servicio | Indicador | Objetivo mensual |
|---|---|---:|
| API | requests válidas no 5xx | 99,5 % |
| Consulta latest | respuestas dentro de 1 s | 99 % |
| Ingesta | mensajes aceptados persistidos <5 s | 99 % |
| Alarmas | condición aceptada→alarma <8 s | 99 % |
| Gateway state | cambio visible <30 s | 99 % |

No se cuentan mantenimientos aprobados ni enlaces OT externos en disponibilidad
cloud; se reportan por separado.

## Métricas mínimas

### Edge

- buffer messages/bytes/oldest age;
- samples read/failed;
- adapter state;
- publish attempts/acks;
- reconnect count;
- clock offset/status;
- disk/memory/CPU;
- dropped messages.

### IoT/cola

- conexiones/rechazos;
- messages published/rule failures;
- queue depth/oldest age;
- receive/delete/retry;
- DLQ count;
- duplicate ratio.

### Worker

- envelopes accepted/rejected;
- samples/s;
- batch duration;
- schema/type/unit/mapping errors;
- dedupe and out-of-order;
- DB latency;
- per-stage lag.

### API/operations

- request rate, status, duration;
- auth denials por código seguro;
- active DB connections;
- alarm transitions;
- acknowledgement conflicts;
- websocket connections/reconnects;
- jobs pending/failure.

### RDS

- CPU, memory, connections;
- read/write IOPS and latency;
- free storage;
- locks/deadlocks;
- replication/failover;
- rows and bytes per partition;
- autovacuum lag;
- slow queries.

## Alertas

| Alerta | Umbral inicial | Severidad |
|---|---|---|
| Edge buffer >75 % o oldest >12 h | 10 min | SEV-3 |
| Edge buffer >90 % | 5 min | SEV-2 |
| Dropped messages >0 | inmediato | SEV-2 |
| Queue oldest >5 min | 10 min | SEV-2 |
| DLQ >0 | inmediato | SEV-2 |
| Rejection rate >1 % | 10 min | SEV-3 |
| Identity mismatch >0 | inmediato | Security |
| API 5xx >2 % | 5 min | SEV-2 |
| RDS free storage <20 % | 15 min | SEV-2 |
| Backup failed | inmediato | SEV-2 |
| Cert expiry <14 días | diario | SEV-3 |
| RLS/authorization anomaly | inmediato | SEV-1 |

Los umbrales se recalibran con CAP-01; no deben silenciarse para “mejorar” el
dashboard.

## Trazabilidad de una muestra

Campos de correlación:

- gateway ID;
- MQTT message ID;
- session/sequence;
- SQS message ID técnico;
- ingestion correlation ID;
- DB message ID;
- alarm/outbox correlation ID.

La UI no expone identificadores internos del proveedor salvo vista de soporte.

## Error budget

Con SLO 99,5 %, el presupuesto mensual aproximado es 3 h 39 min. Consumir 50 %
en siete días congela cambios no esenciales y exige revisión de causa.

