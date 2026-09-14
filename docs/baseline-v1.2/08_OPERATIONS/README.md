# Operación y topología del piloto

## Decisión

El piloto se ejecutará en AWS `sa-east-1` (South America — São Paulo) con
servicios administrados y contenedores sin Kubernetes.

La elección se basa en disponibilidad actual verificable. Una región Chile no
se considera dependencia del MVP mientras no figure disponible con los
servicios requeridos.

## Archivos

| Archivo | Propósito |
|---|---|
| `pilot-topology.md` | cuentas, red, servicios y flujos |
| `capacity-sizing.md` | envelope medible y sizing inicial |
| `backup-disaster-recovery.md` | RPO/RTO, copias y restore |
| `observability-slo.md` | SLI/SLO, métricas y alertas |
| `cost-envelope.md` | componentes de costo y gate presupuestario |

## Fuentes oficiales verificadas

- [Regiones AWS](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html)
- [ECS con AWS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [MQTT 5 en AWS IoT Core](https://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html)
- [OIDC externo con Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-oidc-idp.html)
- [MFA en Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html)
- [Particiones PostgreSQL en RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL_Partitions.html)
- [Restore point-in-time RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html)

