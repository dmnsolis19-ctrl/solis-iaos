# ADR-044 — Preparación estática para AWS IoT

| Campo    | Valor                               |
| -------- | ----------------------------------- |
| Estado   | Aceptado para V0.5 sin despliegue   |
| Fecha    | 14-09-2026                          |
| Extiende | ADR-043                             |
| Detalla  | ADR-029, ADR-035, ADR-036 y ADR-038 |

## Contexto

V0.4 demostró el contrato canónico con datos sintéticos en un laboratorio local.
La landing zone `staging` incorpora toda la aplicación y tiene prerrequisitos y
costos que no corresponden a la primera verificación de AWS IoT.

## Decisión

V0.5 agrega una pila Terraform independiente `iot-readiness` para representar:

- identidad lógica de un gateway sintético;
- policy de publicación con mínimo privilegio;
- AWS IoT Rule deshabilitada hacia SQS Standard;
- DLQ para mensajes que el worker no pueda procesar;
- metadatos de topic, client ID y timestamp del broker.

La configuración conserva el namespace MQTT V1. El `tenant_id` y `gateway_id`
quedan fijados en los recursos de policy y no se confían desde el payload.

## Límites

- sin cuenta, credenciales, backend remoto, `plan` ni `apply`;
- sin certificados o claves privadas administrados por Terraform;
- sin conexión física, datos reales o exposición del broker local;
- sin topics de comandos, setpoints o control remoto;
- sin ECS, RDS, ALB, NAT Gateway, CloudFront o WAF nuevos;
- `enable_ingestion` debe permanecer en `false`.

## Gate siguiente

El primer despliegue requiere aceptación formal de ADR-036/038, presupuesto,
residencia de datos, cuenta nonprod, GitHub OIDC, backend de estado, revisión del
plan y procedimiento de emisión/revocación de certificados.
