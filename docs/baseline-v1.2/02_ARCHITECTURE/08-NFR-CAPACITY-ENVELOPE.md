# NFR y Capacity Envelope V1.2

## Autoridad

ADR-040 y `08_OPERATIONS/capacity-sizing.md` reemplazan los valores V1.1.

## Perfil piloto

| Métrica | Objetivo |
|---|---:|
| Tenant real + tenant sintético | 2 |
| Sites reales | 1 |
| Gateways reales | 2 |
| Assets | 250 |
| Variables | 1.000 |
| Variables con agregado 1m | 200 |
| Muestras sostenidas | 50/s |
| Pico | 250/s, 15 min |
| Stress no contractual | 1.000/s, 5 min |
| Usuarios concurrentes | 20 |
| Buffer Edge | 24 h nominal |

## Rendimiento

| Flujo | SLO |
|---|---|
| API simple | p95 <500 ms |
| Inventario | p95 <1 s |
| Histórico 24 h ≤2.000 puntos | p95 <2 s |
| MQTT→persistencia | p95 <5 s |
| MQTT→alarma | p95 <8 s |
| UI desde persistencia | p95 <5 s |

## Continuidad

| Métrica | Objetivo |
|---|---|
| Disponibilidad API | 99,5 % mensual |
| RPO transaccional | 15 min |
| RTO transaccional | 4 h |
| Restore | antes de prod y trimestral |

## Retención

| Clase | Retención |
|---|---:|
| Raw | 30 días |
| Agregado 1 min | 13 meses |
| Agregado 1 h | 36 meses |
| Alarmas/auditoría | 36 meses |

Estos números autorizan diseño y Sprint 0; Pilot Production requiere ejecutar
las pruebas CAP y aprobar costo/residencia.
