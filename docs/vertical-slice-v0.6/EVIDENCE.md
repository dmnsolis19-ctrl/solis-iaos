# Evidencia V0.6 AWS Sandbox

| Campo | Resultado |
|---|---|
| Fecha | 2026-09-20 |
| Region | sa-east-1 |
| Entorno | readiness sintetico |
| Commit del gate | 20b752b |
| Veredicto | PASS |
| Recursos Terraform | 8 |
| Deriva final | Ninguna |
| Colas al finalizar | SQS 0, DLQ 0 |

## Controles previos

- MFA habilitado.
- Sin access keys permanentes.
- Presupuesto SOLIS-IAOS-Zero-Spend de USD 1.
- Alerta de gasto real superior a USD 0.01.
- Estado Terraform y variables locales ignorados por Git.
- Clave privada creada fuera de Terraform y fuera del repositorio.
- Copias del estado protegidas localmente.

## Identidad y permisos

- Certificado exclusivo para solis-gw-lab-001.
- Certificado inactivo rechazado con exit code 7.
- Certificado activo aceptado con TLS y QoS 1.
- Client ID incorrecto rechazado con exit code 7.
- Tenant/topic incorrecto rechazado con exit code 7.
- Policy limitada a Connect y Publish sobre el gateway sintetico.

## IoT Core a SQS

- Publicacion autorizada confirmada mediante PUBACK.
- Mensaje de prueba recibido en SQS.
- Test ID: 741e4d28-1ab4-4024-b12e-c92a17a766f3.
- mqtt_client_id y mqtt_topic preservados.
- El primer intento por argumento produjo ParseError; se corrigio publicando JSON validado desde archivo.

## SQS a DLQ

- maxReceiveCount: 5.
- Test ID: 8ef5d6ed-5391-4156-a35a-00ce3121569a.
- Recepciones observadas: 1, 2, 3, 4 y 5.
- El mensaje abandono la cola principal y llego a la DLQ.
- El identificador se mantuvo sin cambios.
- Ambas colas quedaron vacias tras la prueba.

## Estado y reversibilidad

- Terraform plan final: No changes.
- DriftCheckExitCode: 0.
- Hash SHA-256 del estado validado:
  158606EA53FB341350B5FAE4E41659817ECFF6ED6B990C7BB67F7514025F6218
- Plan de revision: 0 add, 0 change, 8 destroy.
- El plan de destruccion no fue ejecutado.

## Limite conocido

La DLQ cubre mensajes que el consumidor no procesa tras cinco recepciones.
La regla IoT no tiene error_action, por lo que los fallos de entrega IoT a SQS
no se redirigen actualmente a esa DLQ.
