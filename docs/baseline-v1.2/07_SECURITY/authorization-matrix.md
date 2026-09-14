# Matriz de autorización v1

## Roles humanos

| Código | Descripción | Scope máximo |
|---|---|---|
| `PLATFORM_ADMIN` | operación excepcional de SOLIS | plataforma, acceso temporal aprobado |
| `TENANT_ADMIN` | administración del cliente | tenant y todos sus sites |
| `INTEGRATOR_ENGINEER` | ingeniería delegada | tenants/sites explícitos y vigentes |
| `OPERATOR` | operación de monitoreo | sites asignados |
| `MAINTAINER` | consulta técnica | sites asignados |
| `AUDITOR` | consulta y evidencia | tenant/sites asignados, solo lectura |

`PLATFORM_ADMIN` no es una membership normal y no se usa para trabajo diario.
No existe rol “integrador global”.

## Permisos

| Permiso | Platform Admin | Tenant Admin | Integrator Engineer | Operator | Maintainer | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `tenant.read` | E | Sí | Sí | Sí | Sí | Sí |
| `tenant.manage` | E | Sí | No | No | No | No |
| `membership.read` | E | Sí | No | No | No | Sí |
| `membership.manage` | E | Sí | No | No | No | No |
| `site.read` | E | Sí | Sí | Sí | Sí | Sí |
| `site.manage` | E | Sí | Sí | No | No | No |
| `asset.read` | E | Sí | Sí | Sí | Sí | Sí |
| `asset.manage` | E | Sí | Sí | No | No | No |
| `gateway.read` | E | Sí | Sí | Sí | Sí | Sí |
| `gateway.manage` | E | Sí | Sí | No | No | No |
| `gateway.config.manage` | E | Sí | Sí | No | No | No |
| `gateway.revoke` | E | Sí | No | No | No | No |
| `telemetry.read` | E | Sí | Sí | Sí | Sí | Sí |
| `alarm.read` | E | Sí | Sí | Sí | Sí | Sí |
| `alarm.acknowledge` | E | Sí | Sí | Sí | No | No |
| `rule.read` | E | Sí | Sí | Sí | Sí | Sí |
| `rule.manage` | E | Sí | Sí | No | No | No |
| `audit.read` | E | Sí | No | No | No | Sí |
| `report.create` | E | Sí | Sí | Sí | Sí | Sí |

`E` significa elevación excepcional: ticket aprobado, motivo, duración máxima,
MFA y auditoría reforzada.

## Políticas contextuales

Una celda “Sí” no concede acceso por sí sola. Se requiere:

1. token OIDC válido;
2. usuario activo;
3. membership activa y dentro de vigencia;
4. tenant de ruta igual al tenant efectivo;
5. site dentro del scope;
6. recurso activo o permiso explícito para retirado;
7. entitlement vigente cuando aplique;
8. versión/estado compatible con la acción.

## Reglas críticas

- Tenant Admin no puede otorgar `PLATFORM_ADMIN`.
- Integrator Engineer no administra memberships.
- Solo Tenant Admin revoca gateways.
- Configuración Edge requiere vista previa, confirmación y registro; no contiene
  mando OT.
- Operator puede reconocer una alarma, no cambiar la regla.
- Auditor nunca modifica.
- Un usuario con varias memberships selecciona tenant explícitamente; no existe
  una consulta implícita multi-tenant.

## Identidades de servicio

| Principal | Permiso | Restricción |
|---|---|---|
| Backend | CRUD por módulos propios | tenant transaccional y RLS |
| Telemetry Worker | ingestión, latest, rechazos | tenant resuelto desde identidad MQTT |
| Outbox Worker | leer/marcar outbox | itera tenant por tenant, sin BYPASSRLS |
| Report Worker | lectura y objeto temporal | scope incluido en job firmado |
| Edge Gateway | publish/subscribe MQTT propios | certificado exclusivo y ACL |
| CI/CD | desplegar artefactos aprobados | sin acceso a datos de aplicación |

Ninguna identidad de servicio usa credenciales humanas.

## Sesión y MFA

- Cognito User Pool como broker OIDC inicial.
- TOTP obligatorio para Platform Admin y Tenant Admin.
- Para federados, el IdP upstream debe acreditar MFA para roles administrativos.
- access token corto; refresh token rotado y revocable.
- revocar membership invalida acceso de aplicación de inmediato aunque el token
  siga criptográficamente vigente.

## Pruebas

Cada permiso tiene:

- caso permitido;
- rol incorrecto;
- site fuera de scope;
- membership suspendida;
- tenant de otro cliente;
- recurso retirado;
- conflicto de versión;
- auditoría de éxito y denegación crítica.

