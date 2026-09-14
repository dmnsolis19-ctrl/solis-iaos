# SOLIS IAOS — Manifiesto de versiones V0.3

**Fecha de verificación:** 2026-09-13

| Componente   | Versión fijada | Uso                           |
| ------------ | -------------: | ----------------------------- |
| Node.js      |    24.18.0 LTS | Runtime y build               |
| pnpm         |        11.17.0 | Workspace, lockfile y SBOM    |
| TypeScript   |          5.9.3 | Compilación estricta          |
| NestJS       |        11.1.28 | API modular                   |
| Fastify      |         5.10.0 | Adaptador HTTP                |
| React        |         19.2.8 | Shell web                     |
| Vite         |          8.1.5 | Build web                     |
| PostgreSQL   |          17.10 | Local y RDS                   |
| Mosquitto    |          2.1.2-alpine | Broker MQTT local             |
| LocalStack   |         4.14.0 | SQS local                     |
| Terraform    |         1.15.8 | Landing zone                  |
| AWS Provider |         6.56.0 | Recursos AWS                  |
| Trivy Action |         0.36.0 | Escaneo filesystem e imágenes |
| Trivy CLI    |         0.69.3 | Validación local en Docker    |
| Node-RED     |          5.0.7 | Flujo local de ingesta V0.3   |
| InfluxDB OSS |          2.8.0 | Series temporales del prototipo |
| Grafana      |         12.1.1 | Dashboard local provisionado  |

Node-RED, InfluxDB y Grafana pertenecen exclusivamente al corte vertical local
autorizado por ADR-042. No reemplazan las decisiones de staging o producto de
la baseline V1.2.

Las dependencias JavaScript exactas se resuelven en `pnpm-lock.yaml`; las
imágenes se fijan por tag y las imágenes de aplicación se promueven a staging
únicamente por digest SHA-256.

Terraform y Trivy locales se ejecutan mediante
`hashicorp/terraform:1.15.8` y `aquasec/trivy:0.69.3`; no requieren instalación
en el host.

## Fuentes primarias

- [Node.js — descargas](https://nodejs.org/en/download)
- [PostgreSQL — política y versiones soportadas](https://www.postgresql.org/support/versioning/)
- [Amazon RDS for PostgreSQL — versiones](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-versions.html)
- [NestJS — guía de migración](https://docs.nestjs.com/migration-guide)
- [Vite 8](https://vite.dev/blog/announcing-vite8)
- [Mosquitto 2.1.2](https://mosquitto.org/blog/2026/02/version-2-1-2-released/)
- [LocalStack releases](https://github.com/localstack/localstack/releases)
- [Terraform releases](https://github.com/hashicorp/terraform/releases)
- [AWS Provider releases](https://github.com/hashicorp/terraform-provider-aws/releases)
- [Trivy Action releases](https://github.com/aquasecurity/trivy-action/releases)
- [Fastify OpenTelemetry](https://github.com/fastify/otel)
