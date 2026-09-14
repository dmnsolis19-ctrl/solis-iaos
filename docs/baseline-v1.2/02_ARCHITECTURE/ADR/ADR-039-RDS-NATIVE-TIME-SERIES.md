# ADR-039 — PostgreSQL nativo particionado en RDS

| Campo | Valor |
|---|---|
| Estado | Propuesto para aceptación |
| Fecha | 26-07-2026 |
| Detalla y reemplaza para MVP | Parte abierta de ADR-031 |

## Contexto

ADR-031 dejó pendiente extensión/licencia. TimescaleDB no debe forzar una base
autogestionada ni un segundo proveedor antes de medir el piloto.

## Decisión

Usar RDS PostgreSQL 17 con:

- particionado declarativo por tiempo;
- `pg_partman`/`pg_cron` si la versión soportada supera el spike;
- tablas agregadas 1m/1h;
- RLS, FK y transacciones nativas;
- raw 30 días;
- sin TimescaleDB en MVP.

Sprint 0 fija minor y valida extensiones. El sistema no depende de APIs
propietarias de series.

## Alternativas

- Timescale autogestionado: rechazado por operación/HA.
- Tiger Cloud/segundo proveedor: diferido por red, costo y tenancy.
- Timestream/NoSQL: rechazado por duplicar modelo y RLS.

## Consecuencias

- stack administrado simple;
- mayor disciplina de particiones/agregados;
- menor compresión que soluciones especializadas;
- extracción futura posible mediante contrato de Telemetry Query.

## Revisión

Raw >2 TB, >2.000 muestras/s sostenidas, retención raw >90 días o interferencia
medida con transacciones.

