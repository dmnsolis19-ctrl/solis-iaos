# SOLIS IAOS — Checklist de activación externa

Este checklist completa la evidencia de FND-03, FND-04 y FND-07 a FND-10. No
autoriza Pilot Production ni conexión OT.

## 0. Sprint 0B local

- [ ] Ejecutar `pnpm sprint0b:preflight`.
- [ ] Ejecutar `pnpm sprint0b`.
- [ ] Confirmar `verdict: PASS` en el `summary.json` de la última ejecución.
- [ ] Conservar reporte, logs y resultados Trivy con el paquete o commit
      validado.

## 1. Repositorio y gobierno

- [ ] Crear/importar el repositorio.
- [ ] Proteger `main`: pull request obligatorio, una aprobación y checks
      requeridos.
- [ ] Ejecutar `CI`, `Security` y `Terraform` sin omisiones.
- [ ] Conservar SBOM, reportes de Trivy y logs de integración como artefactos.

## 2. Integración local/CI

- [ ] Ejecutar `docker compose -f infra/local/compose.yaml up -d --wait`.
- [ ] Aplicar dos veces `pnpm db:migrate:up` y confirmar idempotencia.
- [ ] Ejecutar las tres pruebas PostgreSQL/RLS con `TEST_DATABASE=true`.
- [ ] Ejecutar `pnpm local:smoke`.
- [ ] Construir y arrancar las cuatro imágenes sin privilegios.
- [ ] Exportar un trace E2E de salud con correlación.

## 3. AWS staging sintético

- [ ] Confirmar cuenta, región `sa-east-1`, residencia y presupuesto.
- [ ] Crear rol OIDC de GitHub con privilegio mínimo.
- [ ] Crear bucket S3 de estado con versionado y lockfile habilitados.
- [ ] Preparar zona Route 53, hostname y certificado ACM coincidente.
- [ ] Configurar el environment protegido `staging`.

Variables de GitHub requeridas:

| Variable              | Propósito                        |
| --------------------- | -------------------------------- |
| `AWS_ROLE_TO_ASSUME`  | Rol asumido mediante OIDC        |
| `TF_STATE_BUCKET`     | Estado remoto cifrado            |
| `API_CERTIFICATE_ARN` | Certificado ACM en `sa-east-1`   |
| `API_HOSTNAME`        | Hostname HTTPS de la API         |
| `ROUTE53_ZONE_ID`     | Zona que contiene `API_HOSTNAME` |

## 4. Terraform y despliegue

- [ ] Ejecutar `terraform fmt -check -recursive`.
- [ ] Ejecutar `terraform init -backend=false` y `terraform validate`.
- [ ] Revisar el plan, costos, cuotas, acceso público y reglas de red.
- [ ] Hacer bootstrap con `deploy_services=false`.
- [ ] Construir, escanear y publicar imágenes.
- [ ] Resolver y desplegar únicamente referencias `@sha256`.
- [ ] Confirmar estabilidad ECS y smoke HTTPS por el hostname certificado.
- [ ] Verificar logs, alarmas, backup y recuperación de staging.

## Criterio de salida

Sprint 0B local puede cerrarse con su gate completo en `PASS`. La activación de
staging AWS sigue separada y solo puede cerrarse cuando no existan checks
pendientes, todos los gates sean reproducibles desde un commit identificado y
los bloqueos de cuenta, DNS, presupuesto y residencia estén formalmente
aceptados.
