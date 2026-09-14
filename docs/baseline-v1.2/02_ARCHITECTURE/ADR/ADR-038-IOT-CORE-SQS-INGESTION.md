# ADR-038 — AWS IoT Core y cola duradera de ingesta

| Campo | Valor |
|---|---|
| Estado | Propuesto para aceptación |
| Fecha | 26-07-2026 |
| Detalla | ADR-029, ADR-035 |

## Contexto

Un worker conectado directamente al broker acopla sesiones MQTT con
procesamiento y backpressure de base. El delivery ya es at-least-once y debe
tolerar duplicado/desorden.

## Decisión

- AWS IoT Core como broker MQTT 5 con X.509/policies;
- IoT Rule entrega telemetría a SQS Standard;
- Telemetry Worker consume SQS por lotes;
- DLQ para poison messages;
- idempotencia en PostgreSQL;
- configuración desired se publica mediante IoT Data Plane;
- MQTT sigue limitado a Edge↔cloud.

## Alternativas

- worker MQTT directo: válido para spike, rechazado para piloto por backpressure.
- EMQX autogestionado: rechazado por operación de broker/HA.
- Kafka: rechazado por complejidad y volumen.
- SQS FIFO: no requerido; orden global no existe en fuentes.

## Consecuencias

- durabilidad y desacoplamiento;
- metadatos de identidad confiables deben preservarse desde IoT Rule;
- duplicado/desorden siguen siendo parte del contrato;
- un servicio gestionado adicional y costo por request;
- portabilidad mediante puerto de cola.

## Revisión

Si reglas IoT no preservan identidad requerida, costos exceden envelope o el
throughput exige otra estrategia comprobada.

