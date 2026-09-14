# ADR-031 — PostgreSQL con capacidad de series temporales

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |

## Contexto

El MVP combina datos relacionales fuertes con históricos de telemetría. Agregar
MongoDB o un historiador separado aumenta operación e integración.

## Decisión

Usar PostgreSQL para datos transaccionales y una extensión compatible de series
temporales para samples, retención y agregados. La versión y licencia se fijan
tras una prueba de compatibilidad.

No se incorpora MongoDB ni base vectorial.

## Consecuencias

- transacciones, FK y RLS en una plataforma;
- consultas integradas por activo;
- riesgo de crecimiento concentrado;
- necesidad de partición/hypertables, compresión, retención y pruebas de carga;
- posibilidad de extraer el histórico cuando el volumen lo exija.

## Criterio de revisión

Reevaluar con volumen real, costo, límites del proveedor o requisitos de
retención que excedan el capacity envelope.

