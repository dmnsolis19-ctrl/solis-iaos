# Módulo Control Plane & Identity

## Estado MVP

Incluido en alcance mínimo. Reemplaza la separación inicial entre Identity
Service y Tenant Service.

## Responsabilidades

- integrar autenticación OIDC;
- tenants;
- memberships;
- roles y scopes tenant/site;
- delegación al integrador;
- sitios de tenant como raíz administrativa;
- entitlements manuales;
- auditoría administrativa.

## Fuera del módulo

- almacenamiento de contraseñas;
- billing y facturación;
- autorización de topic MQTT;
- datos de activo;
- soporte global no auditado.

## Invariantes

- una identity puede tener varias memberships;
- una membership pertenece a un tenant;
- scope site pertenece al mismo tenant;
- retirar membership invalida acceso efectivo;
- un integrador solo accede mediante delegación activa;
- el último Tenant Admin no se elimina sin transferencia controlada.

## Interfaces

Expone a otros módulos:

- contexto autenticado;
- verificación de acción/recurso/scope;
- tenant y site válidos;
- entitlement.

No expone tokens ni tablas internas.

## Cambios respecto de V1.0

- OIDC sustituye identidad propietaria;
- RBAC scoped sustituye RBAC+ABAC general;
- integrador es actor delegado, no tenant padre;
- entitlements son manuales;
- billing y licencias automáticas se difieren.

## Pruebas críticas

- acceso cruzado denegado;
- membership retirada;
- scope site;
- MFA/admin según proveedor;
- intento de bypass por integrador;
- auditoría de cambio de rol.

