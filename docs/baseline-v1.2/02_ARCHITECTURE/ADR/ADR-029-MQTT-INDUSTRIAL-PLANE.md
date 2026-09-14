# ADR-029 — MQTT limitado al plano industrial

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |
| Acota | ADR-004, ADR-009 |

## Contexto

V1.0 propone MQTT para telemetría, eventos, comandos y comunicación de servicios.
Esto mezcla identidades de dispositivos, eventos de dominio y coordinación
interna.

## Decisión

MQTT 5 se usa entre Edge y nube para:

- telemetría;
- estado/LWT;
- diagnóstico;
- configuración deseada/reportada.

Los módulos del backend se coordinan mediante llamadas internas, eventos en
proceso y outbox. No hay comandos OT en MVP.

## Consecuencias

- ACL y observabilidad más comprensibles;
- menor acoplamiento al broker;
- ausencia de un bus distribuido general;
- migración futura de eventos internos posible sin cambiar Edge.

## Criterio de revisión

Introducir otro broker interno solo ante throughput, durabilidad o desacoplamiento
medido que outbox/jobs no resuelvan.

