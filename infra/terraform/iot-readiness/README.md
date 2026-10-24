# AWS IoT readiness V0.6

Pila Terraform aislada para validar la arquitectura IoT antes de autorizar una
cuenta o despliegue. Detalla ADR-038 sin reemplazar `../staging`.

## Alcance

- AWS IoT Thing sintético;
- policy por gateway limitada a `Connect` y `Publish`;
- topics exactos de telemetría, estado y diagnóstico;
- IoT Rule de telemetría deshabilitada por defecto;
- SQS Standard con cifrado administrado y DLQ;
- rol IAM exclusivo para `sqs:SendMessage`.

No crea certificados. Una clave privada generada por Terraform quedaría en el
estado y por eso su emisión pertenece al gate de activación externo.

## Validación local sin cuenta AWS

Desde la raíz del repositorio:

```powershell
node .\tools\scripts\check-aws-iot-readiness.mjs
terraform -chdir=.\infra\terraform\iot-readiness fmt -check
terraform -chdir=.\infra\terraform\iot-readiness init -backend=false
terraform -chdir=.\infra\terraform\iot-readiness validate
```

`init -backend=false` descarga el provider y genera archivos locales, pero no
crea recursos AWS. En V0.6, `plan` y `apply` requieren ADR-045 aceptado, controles de costo activos y revision previa del plan.

## Stop conditions

- `enable_ingestion=true` sin `ingestion_activation_approved=true`;
- certificado, cuenta, presupuesto o residencia sin aprobar;
- policy con comodín de tenant/gateway;
- topics de comando, setpoint o escritura OT;
- credenciales estáticas o archivos de claves dentro del repositorio.

## Cambios de código V0.7 (pendientes de validación Terraform y despliegue)

La regla tiene ahora `error_action` SQS hacia la DLQ ya existente. El rol solo
puede enviar a las dos colas concretas, y su trust policy exige la cuenta y el
ARN exactos de esta regla. No se agregan recursos ni se modifica el gate de
activación. Las evidencias V0.6 siguen describiendo exclusivamente V0.6.

La DLQ puede contener mensajes canónicos que falló el consumidor y wrappers de
error IoT. No ejecutar redrive indiscriminado: consultar
`docs/saas-integration-v0.7/IOT-ERROR-RECOVERY.md`.

La V0.7 no fue aplicada a AWS. Es obligatorio ejecutar `fmt`, `init`,
`validate` y revisar el nuevo plan antes de desplegar. Si no se dispone del
provider fijado, conservar el cambio como candidato sin activar.
