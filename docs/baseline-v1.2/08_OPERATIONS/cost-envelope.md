# Envelope preliminar de costo

## Objetivo

Evitar aprobar una arquitectura cuyo costo real se descubra después del piloto.
Este documento no reemplaza una cotización del proveedor.

## Componentes

| Driver | Unidad |
|---|---|
| ECS Backend/Worker | vCPU-hora, GiB-hora, cantidad mínima |
| RDS Multi-AZ | clase-hora, storage, IOPS, backup excedente |
| AWS IoT Core | conexiones-minuto, mensajes y reglas |
| SQS/DLQ | requests y payload chunks |
| CloudFront/WAF/ALB | requests, reglas y transferencia |
| S3 | GB-mes, requests, lifecycle |
| NAT/VPC endpoints | horas y GB |
| Logs/métricas/trazas | ingestión, retención y consultas |
| Cognito | usuarios activos y funciones de seguridad |
| Backup cross-account | GB-mes y copia |
| Soporte | plan AWS y operación humana |

## Presupuesto interno de diseño

Para evitar falsa precisión, el gate usa un rango inicial de
**USD 700–1.800/mes**, sin impuestos ni soporte humano. El valor debe
recalcularse con AWS Pricing Calculator usando:

- `sa-east-1`;
- dos tareas backend;
- un worker;
- RDS Multi-AZ con 200 GB;
- 50 muestras/s;
- 20 usuarios concurrentes;
- retención V1.2;
- volumen de logs limitado;
- transferencia real estimada.

Si el cálculo supera USD 1.800/mes, se requiere optimización y nueva aprobación.
No se elimina Multi-AZ, backup, RLS o seguridad para reducir costo sin ADR.

## Guardrails

- budgets 50/80/100/120 %;
- anomaly detection;
- tags obligatorios;
- retención de logs explícita;
- staging apagable fuera de ventana si no afecta pruebas;
- no usar Fargate Spot para API/worker del piloto;
- reportes con expiración;
- alertas ante crecimiento de storage/telemetry;
- revisión semanal durante el primer mes.

## Aprobación pendiente

Finanzas/Product Owner debe registrar:

- moneda y techo mensual;
- responsable de cuenta;
- centro de costo;
- plan de soporte;
- tratamiento de impuestos;
- criterio de suspensión segura si se excede.

