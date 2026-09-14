# Namespace y ACL MQTT v1

## Namespace

| Flujo | Topic |
|---|---|
| Telemetría | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/telemetry` |
| Estado/LWT | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/status` |
| Diagnóstico | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/diagnostics` |
| Configuración deseada | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/config/desired` |
| Configuración reportada | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/config/reported` |

No existe topic de comandos en el MVP.

## Identidades

- `gateway/{gatewayId}`: certificado X.509 exclusivo asociado a un gateway.
- `cloud/config-publisher`: identidad IAM del backend para configuración.
- `cloud/ingestion-rule`: regla gestionada que entrega mensajes a la cola.
- `ops/diagnostic-reader`: acceso humano excepcional mediante consola auditada;
  no se incorpora a la aplicación.

## Matriz ACL

| Identidad | Connect | Publish | Subscribe/Receive | Denegado |
|---|---|---|---|---|
| Gateway | client ID exacto | telemetry, status, diagnostics, config/reported propios | config/desired propio | cualquier otro tenant/gateway |
| Backend config | n/a MQTT cliente | config/desired del gateway autorizado | ninguno | telemetry y commands |
| Regla de ingesta | servicio | cola interna | topics v1 autorizados | otros namespaces |
| Operador humano | ninguno | ninguno | ninguno | acceso directo al broker |

## Reglas de autorización

1. `tenantId` y `gatewayId` se resuelven desde la asociación de identidad; el
   payload no amplía acceso.
2. El client ID debe ser exactamente `solis-gw-{gatewayId}`.
3. Cada certificado se asocia de forma exclusiva a un gateway.
4. El policy document usa variables de Thing/identidad y no wildcards globales.
5. Revocar un gateway desactiva certificado, policy attachment y configuración.
6. La aplicación no recibe credenciales privadas del gateway.
7. Certificados de staging y piloto pertenecen a cuentas distintas.

## Semántica

| Topic | QoS | Retained | Límite payload | Expiry |
|---|---:|---:|---:|---:|
| Telemetry | 1 | No | 256 KiB | 24 h |
| Status | 1 | Sí | 16 KiB | 25 h |
| Diagnostics | 1 | No | 64 KiB | 24 h |
| Config desired | 1 | Sí | 256 KiB | 7 días |
| Config reported | 1 | Sí | 64 KiB | 7 días |

El límite contractual puede ser menor que el límite del proveedor.

## LWT

- topic: status propio;
- payload válido con `state=OFFLINE`;
- QoS 1;
- retained;
- delay y session expiry probados contra el proveedor;
- la UI distingue desconexión observada de estado desconocido.

## Pruebas negativas obligatorias

- certificado A intenta publicar como gateway B;
- gateway publica en tenant distinto;
- gateway publica `config/desired`;
- backend publica telemetry;
- cliente anónimo conecta;
- certificado revocado reconecta;
- topic con nombre de activo intenta evadir ACL;
- payload declara gateway distinto al topic;
- wildcard intenta abarcar dos tenants;
- sesión reanudada conserva permisos antiguos tras revocación.

