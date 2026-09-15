# AWS IoT readiness V0.5

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
crea recursos AWS. No ejecutar `plan` ni `apply` durante V0.5.

## Stop conditions

- `enable_ingestion` distinto de `false`;
- certificado, cuenta, presupuesto o residencia sin aprobar;
- policy con comodín de tenant/gateway;
- topics de comando, setpoint o escritura OT;
- credenciales estáticas o archivos de claves dentro del repositorio.
