# ADR-026 — Monolito modular para el MVP

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |
| Reemplaza | ADR-003 para la etapa MVP |

## Contexto

V1.0 divide la plataforma en once microservicios. El equipo aún no dispone de
contratos, métricas de escala, operación 24/7 ni equipos autónomos que justifiquen
esa distribución.

## Decisión

El backend del MVP será un monolito modular por dominios. Cada módulo mantiene
API interna, ownership de tablas, migraciones, pruebas y prohibición de acceso
directo desde otros módulos.

La ingesta de telemetría se ejecuta en un worker independiente debido a su
perfil de carga y recuperación.

## Alternativas

- Once microservicios: rechazada por complejidad prematura.
- Monolito sin límites: rechazado por alto acoplamiento.
- Serverless por función: rechazado como baseline por fragmentación y
  características variables del proveedor.

## Consecuencias

Positivas:

- transacciones locales;
- depuración y despliegue simples;
- menor superficie operativa;
- extracción futura posible.

Negativas:

- disciplina obligatoria para preservar módulos;
- escalamiento conjunto de backend;
- una falla del proceso puede afectar varios módulos.

## Criterio de revisión

Reevaluar cuando un módulo demuestre perfil de escala, disponibilidad, seguridad
o autonomía de equipo distinto.

