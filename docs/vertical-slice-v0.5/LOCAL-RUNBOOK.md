# Runbook local V0.5

## Validación que no requiere AWS

```powershell
cd C:\SOLIS-IOT
node .\tools\scripts\check-aws-iot-readiness.mjs
terraform -chdir=.\infra\terraform\iot-readiness fmt -check
terraform -chdir=.\infra\terraform\iot-readiness init -backend=false
terraform -chdir=.\infra\terraform\iot-readiness validate
git status --short
```

La primera ejecución de `init` necesita Internet para descargar el AWS Provider.
No necesita credenciales y no crea recursos.

## Archivos locales esperados

- `.terraform/`, ignorado por Git;
- `.terraform.lock.hcl`, debe revisarse y versionarse después de `init`.

## No ejecutar en V0.5

```text
aws configure
terraform plan
terraform apply
```

Si se ingresó por error a `aws configure`, cancelar con `Ctrl+C` sin escribir
credenciales. Si un comando solicita aprobación para crear recursos, cancelar.
