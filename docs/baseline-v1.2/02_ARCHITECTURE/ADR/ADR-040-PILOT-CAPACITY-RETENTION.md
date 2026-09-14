# ADR-040 — Capacity y retención del piloto

| Campo | Valor |
|---|---|
| Estado | Propuesto para aceptación |
| Fecha | 26-07-2026 |
| Modifica | Baseline NFR V1.1 |

## Contexto

500 muestras/s sostenidas y 90 días raw producen 3.888 mil millones de muestras.
Ese envelope no corresponde a una primera planta.

## Decisión

Piloto:

- 50 muestras/s sostenidas;
- 250/s por 15 min;
- stress 1.000/s por 5 min;
- raw 30 días;
- agregado 1m 13 meses para máximo 200 variables;
- agregado 1h 36 meses;
- Edge buffer 24 h nominal;
- RPO 15 min y RTO 4 h para transaccional.

Los límites son objetivos de validación, no cuotas comerciales.

## Consecuencias

- costo y prueba acotados;
- V1.1 se conserva como horizonte de escala, no promesa;
- variables trended requieren selección;
- expansión exige medir storage, p95, lag y costo.

## Revisión

Después de CAP-01–10 y antes de sumar el segundo site real.

