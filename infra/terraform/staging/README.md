# Landing zone staging

Terraform declarativo para el ambiente `staging` sintético de SOLIS IAOS.

## Controles

- región fijada en `sa-east-1`;
- Terraform 1.15.8 y AWS Provider 6.56.0;
- imágenes ECS aceptadas únicamente por digest SHA-256;
- ECS Fargate sin Kubernetes;
- RDS PostgreSQL 17.10 privado, cifrado y con contraseña administrada;
- SQS/DLQ cifradas;
- web privada en S3, CloudFront y WAF;
- API por ALB HTTPS y alias Route 53 coherente con el certificado;
- logs y alarmas mínimas.

## Uso

```bash
terraform init -backend-config=backend.hcl
terraform fmt -check -recursive
terraform validate
terraform plan -var-file=staging.tfvars -out=staging.tfplan
terraform show -json staging.tfplan > staging.tfplan.json
```

`apply` solo puede ejecutarse desde el workflow protegido de staging después de
revisión del plan. No se deben usar credenciales estáticas: GitHub asume un rol
AWS mediante OIDC.

## Bloqueos externos

- cuenta y rol AWS;
- bucket de estado;
- zona Route 53, hostname y certificado ACM de API;
- presupuesto y residencia aprobados.

Esta carpeta no habilita Pilot Production ni recursos OT.
