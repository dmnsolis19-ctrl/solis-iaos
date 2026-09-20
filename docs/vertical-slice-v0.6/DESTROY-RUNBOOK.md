# Runbook de destruccion controlada V0.6

Este procedimiento no debe ejecutarse sin aprobacion explicita.

## Advertencia

No aplicar el archivo v06-destroy-review-only.tfplan. Fue creado solo como
evidencia y el certificado externo permanece asociado.

## Orden obligatorio

1. Confirmar que SQS y DLQ estan vacias.
2. Respaldar terraform.tfstate.
3. Identificar el certificado asociado al Thing.
4. Cambiar el certificado a INACTIVE.
5. Separar la policy del certificado.
6. Separar el certificado del Thing.
7. Verificar que no queden asociaciones.
8. Eliminar el certificado en AWS IoT.
9. Generar un nuevo terraform plan -destroy.
10. Revisar que solo existan ocho destrucciones.
11. Aplicar el nuevo plan solo con aprobacion.
12. Verificar que los recursos ya no existan.
13. Conservar o eliminar la clave privada local segun la politica aprobada.

## Descubrimiento seguro

```powershell
$thingName = "solis-gw-lab-001"
$policyName = terraform -chdir=".infra	erraformiot-readiness" output -raw gateway_policy_name
$certificateArn = aws iot list-thing-principals --thing-name $thingName --query "principals[0]" --output text
$certificateId = ($certificateArn -split "/")[-1]

aws iot describe-certificate --certificate-id $certificateId --query "certificateDescription.status"
```

## Desactivar y separar

```powershell
aws iot update-certificate --certificate-id $certificateId --new-status INACTIVE
aws iot detach-policy --policy-name $policyName --target $certificateArn
aws iot detach-thing-principal --thing-name $thingName --principal $certificateArn
```

## Verificar antes de eliminar

```powershell
aws iot list-attached-policies --target $certificateArn
aws iot list-principal-things --principal $certificateArn
```

Ambas listas deben estar vacias.

## Eliminar certificado

```powershell
aws iot delete-certificate --certificate-id $certificateId
```

## Regenerar plan

```powershell
terraform -chdir=".infra	erraformiot-readiness" plan `
  -destroy `
  -var-file="readiness.tfvars" `
  -out=".terraform\v06-destroy-approved.tfplan"
```

El resultado permitido es: 0 add, 0 change, 8 destroy. No aplicar sin una
segunda aprobacion explicita.
