# Arquitectura SaaS y seguridad V1.2

## Modelo SaaS

### Control Plane

- tenant;
- membership;
- role;
- site scope;
- integrator delegation;
- entitlement manual;
- auditoría.

### Data Plane lógico

- assets;
- connectivity;
- telemetry;
- events;
- alarms;
- reports.

Toda operación del Data Plane se evalúa dentro de un tenant explícito.

## Tenant e integrador

| Actor | Definición |
|---|---|
| SOLIS Platform Admin | Opera plataforma; acceso excepcional y auditado |
| Tenant Admin | Administra un cliente y sus sitios |
| Integrator Engineer | Acceso delegado a tenants/sites concretos |
| Operator | Consulta y reconoce alarmas según scope |
| Maintainer | Consulta activos y datos permitidos |
| Auditor | Solo lectura y auditoría |

Un integrador no es tenant padre ni rol con bypass. La delegación tiene fecha,
scope, estado y responsable.

## Autenticación humana

- OIDC/OAuth 2.0;
- MFA obligatorio para administradores;
- Cognito User Pools en el piloto; Keycloak solo con un requisito posterior;
- lifecycle de sesión y recuperación controlada;
- deshabilitación efectiva al retirar membership;
- cuentas de servicio separadas de usuarios.

## Autorización

MVP: RBAC con scope tenant/site. ABAC se pospone hasta tener políticas concretas.

La decisión considera:

- acción;
- tipo e identificador de recurso;
- tenant/site;
- membership activa;
- rol;
- entitlement;
- estado del recurso.

## Identidad de gateway

- certificado único;
- subject/SAN vinculado a gateway estable;
- emisión, renovación, revocación y recuperación;
- ACL derivada de identidad;
- inventario de credenciales sin almacenar clave privada en la nube;
- bloqueo inmediato del gateway retirado.

## Auditoría

Cada acción crítica registra:

- actor e identidad efectiva;
- tenant y scope;
- acción y recurso;
- fecha UTC;
- resultado;
- motivo/comentario cuando aplique;
- IP/cliente cuando sea lícito;
- correlation id;
- valores sensibles redactados.

El audit log es append-only para roles normales.

## Threat model mínimo

| Amenaza | Control |
|---|---|
| Fuga entre tenants | RLS, FK compuestas, scopes, pruebas negativas |
| Gateway falsificado | mTLS, certificado único, revocación |
| Replay/duplicado | message id, sequence, idempotencia |
| PLC expuesto | conexión Edge saliente, segmentación OT |
| Escalamiento de privilegio | RBAC scope, deny by default, auditoría |
| Token robado | expiración, rotación, MFA admin, sesión segura |
| Payload malicioso | validación, límites y rechazo observable |
| Dependencia comprometida | lockfile, escaneo, SBOM, artefacto firmado |
| Pérdida de datos | backup restaurado, buffer Edge, retención |
| Abuso interno | mínimo privilegio y acceso excepcional auditado |

El threat model completo, matriz de autorización, PKI y runbooks están en
`07_SECURITY`.

## Secretos y supply chain

- secretos fuera del repositorio y de imágenes;
- separación por ambiente;
- rotación;
- imágenes mínimas y no-root cuando sea viable;
- dependencias fijadas;
- SBOM;
- escaneo de vulnerabilidades;
- promoción del mismo artefacto;
- revisión de migraciones.

## IEC 62443

La arquitectura adopta prácticas compatibles con segmentación, zonas,
conduits, identidad y mínimo privilegio. La documentación no declara
certificación ni cumplimiento total. Cualquier afirmación comercial requiere
evaluación formal, alcance y evidencia.

## Respuesta a incidentes

Antes del piloto deben existir runbooks para:

- compromiso de gateway;
- certificado filtrado;
- fuga de tenant;
- pérdida de broker;
- ingesta detenida;
- pérdida/restauración de base;
- dependencia crítica vulnerable.
