# ADR-027 — Unidades desplegables mínimas del MVP

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |
| Relacionado | ADR-026, ADR-033 |

## Contexto

Modularidad lógica no implica un proceso o imagen por capacidad.

## Decisión

Las unidades de producto son:

1. web;
2. backend modular;
3. telemetry worker;
4. edge agent/simulator.

Broker, PostgreSQL, OIDC y object storage son dependencias de plataforma.

## Razón

Web, ingesta y Edge tienen ciclos y perfiles distintos. El resto puede convivir
en el backend sin perder ownership lógico.

## Consecuencias

- cuatro pipelines de artefactos como máximo;
- observabilidad correlacionada entre procesos;
- no se despliegan Asset, Alarm o Tenant como servicios separados;
- la base puede escalarse de forma gestionada;
- la extracción futura exige contrato y migración de datos.

## Criterio de conformidad

Agregar una unidad desplegable requiere ADR con costo operacional, SLO, ownership
y plan de datos.

