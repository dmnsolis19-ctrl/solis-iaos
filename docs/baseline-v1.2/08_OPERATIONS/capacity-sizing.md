# Capacity envelope y sizing inicial

## Corrección de V1.1

El objetivo de 500 muestras/s sostenidas con 90 días raw implicaba:

`500 × 86.400 × 90 = 3.888.000.000 muestras`

Eso es una meta de escala posterior, no un piloto prudente. V1.2 separa carga
operacional del piloto y prueba de estrés.

## Perfil piloto aprobado técnicamente

| Métrica | Límite piloto |
|---|---:|
| Tenants reales | 1 |
| Tenant sintético para aislamiento | 1 |
| Sites reales | 1 |
| Gateways reales | 2 |
| Gateways simulados en prueba | 10 |
| Assets | 250 |
| Variables configuradas | 1.000 |
| Variables con tendencia 1 min | 200 |
| Muestras sostenidas globales | 50/s |
| Pico operacional | 250/s durante 15 min |
| Stress no contractual | 1.000/s durante 5 min |
| Usuarios concurrentes | 20 |
| Alarmas abiertas | 1.000 |
| Buffer Edge | 24 h al nominal de cada gateway |

## Volumen

### Raw

- 50/s × 86.400 × 30 días = 129.600.000 muestras.
- presupuesto físico conservador: 250 bytes por muestra con índices;
- estimación: ~32,4 GB raw+índices antes de margen operativo.

### Agregado 1 minuto

- 200 variables × 1.440 buckets/día × 395 días = 113.760.000 filas.
- el sizing debe medir tamaño real; no se asume compresión inexistente.

### Agregado 1 hora

- 200 × 24 × 1.095 días = 5.256.000 filas.

### Edge

Con 25 muestras/s por gateway:

- 2.160.000 muestras en 24 h;
- a 200 bytes lógicos: ~432 MB;
- con WAL, índices y margen: reservar al menos 4 GB para buffer;
- alerta a 60 %, 75 %, 90 % y overflow.

## Sizing inicial, no compromiso de compra

| Unidad | Inicio | Escala |
|---|---|---|
| Backend Fargate | 2 tareas, 1 vCPU/2 GiB | CPU, memoria, p95 |
| Telemetry Worker | 1 tarea, 1 vCPU/2 GiB | queue age y batch latency |
| Report jobs | bajo demanda, 1 vCPU/2 GiB | cuota concurrente |
| RDS PostgreSQL | 2 vCPU/8 GiB, Multi-AZ | CPU, IOPS, cache, locks |
| RDS storage | 200 GB gp3, autoscaling hasta 1 TB | bytes/partición y free space |
| SQS | Standard, 4 días | age, DLQ |
| DLQ | 14 días | redrive manual aprobado |

Los SKU definitivos se fijan después de la prueba de carga; el documento expresa
capacidad, no preferencia por tamaño.

## Objetivos de rendimiento

| Flujo | SLO piloto |
|---|---|
| API simple | p95 < 500 ms; p99 < 1 s |
| Inventario paginado | p95 < 1 s |
| Histórico 24 h, ≤2.000 puntos | p95 < 2 s |
| MQTT→persistencia normal | p95 < 5 s |
| MQTT→alarma | p95 < 8 s |
| UI desde persistencia | p95 < 5 s |
| Reconocimiento de alarma | p95 < 1 s |

## Pruebas

| ID | Perfil | Duración | Aprobación |
|---|---|---:|---|
| CAP-01 | 50/s + 20 usuarios | 8 h | sin backlog creciente |
| CAP-02 | 250/s | 15 min | recuperación < 15 min |
| CAP-03 | 1.000/s | 5 min | sin pérdida; degradación registrada |
| CAP-04 | desconexión Edge | 24 h simulada | replay sin duplicar efectos |
| CAP-05 | 10 gateways reconnect | 10 min | broker/queue estables |
| CAP-06 | histórico concurrente | 20 usuarios | SLO de consulta |
| CAP-07 | 1.000 alarmas activas | 30 min | bandeja y transición estables |
| CAP-08 | worker detenido | 30 min | cola protege y recupera |
| CAP-09 | poison payload | 1.000 mensajes | DLQ, sin loop |
| CAP-10 | RDS failover/restore | ejercicio | RPO/RTO observado |

## Criterio del gate

El envelope queda **aprobado como objetivo**, no medido. Sprint 0 puede comenzar
con GO condicionado, pero Pilot Production no puede abrirse hasta ejecutar
CAP-01, 02, 04, 06, 08 y 10.

