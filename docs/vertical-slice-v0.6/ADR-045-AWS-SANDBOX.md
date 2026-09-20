# ADR-045 — AWS Sandbox sintético

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 20-09-2026 |
| Extiende | ADR-044 |
| Región | sa-east-1 |
| Entorno | sandbox nonprod |

## Contexto

Sprint 0B finalizó con verdict PASS. V0.5 validó de forma estática la ruta
AWS IoT Core → SQS/DLQ, pero no autorizó plan ni despliegue.

## Decisión

V0.6 propone autorizar un sandbox AWS exclusivamente sintético para demostrar:

- identidad individual de un gateway de prueba;
- publicación MQTT con TLS y QoS 1;
- policy restringida por tenant y gateway;
- entrega AWS IoT Core → SQS;
- tratamiento de errores mediante DLQ;
- rechazo de client ID y topics no autorizados;
- trazabilidad y evidencia reproducible.

## Despliegue por etapas

1. Ejecutar terraform plan y revisar costo, IAM y recursos.
2. Primer apply con enable_ingestion=false.
3. Emitir fuera de Terraform un certificado exclusivo para el gateway sintético.
4. Probar conexión y rechazo de permisos inválidos.
5. Activar ingesta únicamente tras aprobar el gate de seguridad.
6. Verificar mensajes en SQS y errores en DLQ.

## Controles obligatorios

- cuenta AWS nonprod;
- región sa-east-1;
- presupuesto y alerta de costos activos;
- sin access keys permanentes;
- MFA habilitado;
- certificado único por gateway;
- clave privada fuera de Git y del estado Terraform;
- mínimo privilegio;
- evidencia de plan y pruebas conservada.

## Exclusiones

- conexión a PLC o red OT;
- datos industriales reales;
- comandos, setpoints o control remoto;
- certificados compartidos;
- credenciales estáticas;
- ECS, RDS, ALB, NAT Gateway, WAF o staging completo;
- Pilot Production.

## Condiciones de parada

Detener el despliegue si:

- la policy contiene comodines de tenant o gateway;
- Terraform intenta administrar claves privadas;
- aparece un recurso fuera del alcance;
- el plan supera el presupuesto aprobado;
- enable_ingestion cambia antes del gate;
- se introduce comunicación hacia el PLC.

## Criterio de salida

V0.6 finaliza cuando el gateway sintético publica mensajes autorizados, los
mensajes llegan a SQS, los fallos llegan a DLQ, los accesos incorrectos son
rechazados y existe evidencia de costos, seguridad y destrucción controlada.
