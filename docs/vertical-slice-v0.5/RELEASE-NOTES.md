# SOLIS IAOS V0.5.0 — AWS IoT Readiness

## Incorporado

- pila Terraform aislada de la landing zone staging;
- identidad sintética de gateway y policy publish-only;
- IoT Rule deshabilitada hacia SQS Standard;
- SQS cifrada, redrive y DLQ;
- validación estática contra certificados, secretos y control remoto;
- arquitectura, gate de seguridad y runbook local.

## Compatibilidad

El contrato MQTT y los JSON Schema V1 no cambian. El laboratorio Docker V0.4
continúa siendo la prueba funcional local.

## Límites

Readiness estático únicamente: sin cuenta, credenciales, certificados, `plan`,
`apply`, conexión OT o costos AWS.
