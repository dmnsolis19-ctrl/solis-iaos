# SOLIS IAOS — Informe de implementación Sprint 0 Foundation

**Versión:** 0.1.0  
**Fecha de corte:** 2026-07-26  
**Baseline arquitectónica:** V1.2 Sprint 0A Closure  
**Alcance:** FND-01 a FND-10, datos exclusivamente sintéticos

## Resumen ejecutivo

La implementación de Foundation está completa a nivel de fuente para el
monorepo, contratos, migraciones, observabilidad, CI/CD, seguridad e
infraestructura declarativa. La solución conserva el monolito modular, mantiene
Telemetry Worker como única unidad separada por carga y no incorpora
funcionalidad de negocio, conexión OT ni control remoto.

El resultado aún no constituye un cierre operativo total de Sprint 0. Faltan
las evidencias que dependen de Docker, PostgreSQL real, Terraform, una cuenta
AWS y un repositorio GitHub configurado. Esas actividades están automatizadas,
pero deben ejecutarse en los ambientes correspondientes antes de autorizar
Sprint 1.

## Estado por historia

| Historia | Resultado entregado                                                                         | Evidencia actual                                                   | Estado                 |
| -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------- |
| FND-01   | Monorepo pnpm/Turborepo con cuatro apps y cuatro paquetes; límites con dependency-cruiser   | Build de 8 paquetes y cero violaciones                             | Completa               |
| FND-02   | Node y pnpm fijados, lockfile, imágenes y proveedores versionados, SBOM CycloneDX           | Lockfile reproducible y SBOM de 497 componentes                    | Completa               |
| FND-03   | Compose con PostgreSQL, Mosquitto y SQS emulado; smoke script                               | Definición lista; no ejecutada localmente por ausencia de Docker   | Evidencia pendiente    |
| FND-04   | Runner transaccional con lock, ledger, checksum, rollback protegido y roles sin `BYPASSRLS` | Pruebas unitarias verdes; tres pruebas PostgreSQL/RLS listas en CI | Evidencia pendiente    |
| FND-05   | Workflows de calidad e integración                                                          | Cadena local de lint, tipos, contratos, unit y build verde         | Lista para CI remoto   |
| FND-06   | OpenAPI 3.1 y cinco JSON Schema MQTT canónicos                                              | OpenAPI válido; esquemas y ejemplos positivos/negativos válidos    | Completa               |
| FND-07   | Pino JSON, correlación, trace ID y OpenTelemetry OTLP                                       | Pruebas de logger/correlación verdes; trace E2E pendiente          | Evidencia pendiente    |
| FND-08   | Landing zone AWS `sa-east-1` en Terraform                                                   | Código completo; `fmt`, `validate` y plan requieren Terraform/AWS  | Bloqueada externamente |
| FND-09   | Bootstrap, imágenes por digest, ECS y smoke HTTPS de staging                                | Workflow preparado; requiere AWS, OIDC, DNS y certificado          | Bloqueada externamente |
| FND-10   | Secretlint, audit, Trivy de filesystem/imágenes y SBOM                                      | Secret scan y audit sin vulnerabilidades conocidas; SBOM generado  | Imagen/Trivy pendiente |

## Arquitectura implementada

- `apps/api`: NestJS sobre Fastify, únicamente salud y base transversal.
- `apps/telemetry-worker`: unidad separada con readiness de SQS, sin ingesta.
- `apps/simulator`: scaffold determinista sin emisión de telemetría.
- `apps/web`: shell React de Foundation sin pantallas de negocio.
- `packages/contracts`: contratos OpenAPI/MQTT copiados y verificados contra
  Baseline V1.2.
- `packages/database`: migraciones versionadas, roles runtime y pruebas de
  aislamiento multi-tenant.
- `packages/observability`: logs estructurados, correlación y OpenTelemetry.
- `infra/local`: dependencias locales con imágenes fijadas.
- `infra/terraform/staging`: VPC, ECS Fargate, ALB/Route 53, RDS, SQS, ECR,
  CloudFront, WAF, logs y alarmas.

## Validación ejecutada

La ejecución local se realizó con Node.js 24.14.0, compatible con el rango del
repositorio. Los pipelines e imágenes objetivo fijan Node.js 24.18.0.

| Control                | Resultado                                                      |
| ---------------------- | -------------------------------------------------------------- |
| Formato y lint         | Verde, cero advertencias                                       |
| TypeScript estricto    | Verde en ocho paquetes                                         |
| Límites de módulos     | 52 módulos, cero violaciones                                   |
| OpenAPI                | OpenAPI 3.1 válido                                             |
| MQTT                   | Cinco schemas compilados; ejemplos esperados válidos/inválidos |
| Sincronía con baseline | Seis contratos y DDL V1.2 idénticos por contenido              |
| Pruebas unitarias      | Nueve pruebas verdes                                           |
| Build                  | Ocho paquetes construidos                                      |
| Smoke de procesos      | API, Worker y Simulator responden salud; API expone trace ID   |
| Dependencias           | Cero vulnerabilidades conocidas en `pnpm audit`                |
| Secretos               | Secretlint verde                                               |
| SBOM                   | CycloneDX 1.6, 497 componentes                                 |

Las tres pruebas de migración/RLS se omitieron de forma explícita en la
ejecución local porque el entorno de trabajo no dispone de Docker ni
PostgreSQL. El workflow de integración las ejecuta con PostgreSQL 17.10 real.
Terraform y Trivy también se validan en workflows dedicados.

## Riesgos residuales

1. El DDL V1.2 todavía debe demostrar `migrate up/down` y aislamiento de dos
   tenants sobre PostgreSQL real.
2. La instrumentación debe demostrar propagación de un trace entre ALB, API y
   exportador OTLP.
3. El plan Terraform puede revelar restricciones de cuenta, cuotas o
   incompatibilidades de proveedor.
4. El costo de NAT, ALB, RDS, WAF y CloudFront debe aprobarse antes del primer
   `apply`.
5. Las imágenes deben pasar Trivy y arrancar como usuario no root en CI.

## Dictamen

**GO para integrar Foundation en un repositorio protegido y ejecutar sus
pipelines. NO-GO todavía para cerrar Sprint 0, iniciar Sprint 1, conectar OT o
usar datos reales.**

El cierre de Sprint 0 requiere que todos los puntos de
`EXTERNAL-ACTIVATION-CHECKLIST.md` queden verdes y que sus evidencias se
conserven con el incremento.
