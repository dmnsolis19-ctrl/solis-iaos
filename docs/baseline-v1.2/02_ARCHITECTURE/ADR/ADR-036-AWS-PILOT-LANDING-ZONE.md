# ADR-036 — Landing zone AWS para el piloto

| Campo | Valor |
|---|---|
| Estado | Propuesto para aceptación |
| Fecha | 26-07-2026 |
| Detalla | ADR-027, ADR-033 |

## Contexto

Sprint 0 requiere proveedor, región y runtime. Mantener la decisión abierta
impide IaC, red, backup y presupuesto.

## Decisión

Pilot Production se diseña para AWS `sa-east-1`:

- cuentas separadas security/backup, nonprod y prod;
- ECS Fargate para backend y worker;
- S3/CloudFront/WAF para web;
- RDS PostgreSQL Multi-AZ;
- servicios sin IP pública salvo edge web controlado;
- Terraform;
- sin Kubernetes ni multi-región.

## Razón

`sa-east-1` es una región sudamericana disponible con tres AZ. AWS Fargate
ejecuta contenedores sin administrar nodos. El stack mantiene portabilidad con
OCI, PostgreSQL, OIDC, MQTT y OpenTelemetry.

## Alternativas

- VM única: menor costo aparente, mayor acoplamiento y operación.
- Kubernetes: rechazado para MVP por complejidad sin necesidad.
- esperar una región Chile: rechazado por disponibilidad no confirmada.
- multi-cloud: rechazado por duplicar operación antes del product-market fit.

## Consecuencias

- dependencia operativa inicial de AWS;
- residencia de datos en Brasil debe aprobarse;
- costos de `sa-east-1` deben calcularse;
- una futura migración mantiene contratos, no garantiza IaC idéntico.

## Revisión

Ante requisito legal/contractual de residencia, indisponibilidad de servicio o
costo superior al envelope.

