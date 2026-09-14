# Baseline física de datos

## Contenido

| Archivo | Propósito |
|---|---|
| `physical-data-model.md` | entidades, ownership e invariantes |
| `schema-v1.sql` | DDL de referencia para migraciones |
| `rls-test-matrix.md` | pruebas positivas y negativas de aislamiento |
| `retention-partitioning.md` | partición, agregación y borrado |

## Estado

El modelo es implementable, pero `schema-v1.sql` no debe ejecutarse manualmente
en producción. Sprint 0 lo convertirá en migraciones incrementales, verificará
compatibilidad con la versión seleccionada de PostgreSQL y ejecutará la matriz
RLS contra una base efímera real.

## Invariantes

- `tenant_id NOT NULL` en datos tenant-owned.
- FK compuestas con `tenant_id`.
- RLS activa y forzada.
- roles runtime sin `BYPASSRLS` y sin ownership.
- el tenant efectivo se fija con `SET LOCAL` dentro de cada transacción.
- el worker no recibe un tenant confiable desde el payload MQTT.
- tablas de telemetría y auditoría son append-oriented.
- no se borra un tenant mediante cascade accidental.

