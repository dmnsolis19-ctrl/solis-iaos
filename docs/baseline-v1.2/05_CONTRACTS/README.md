# Contratos ejecutables del MVP

| Campo | Valor |
|---|---|
| Baseline | SOLIS IAOS V1.2 |
| Estado | Propuesto para aprobación del gate |
| Fecha | 26 de julio de 2026 |
| Compatibilidad | MVP read-mostly, sin control remoto |

## Autoridad

Esta carpeta contiene los contratos que deben gobernar la implementación. En
caso de contradicción, la fuente ejecutable versionada prevalece sobre ejemplos
en documentos narrativos.

| Contrato | Archivo canónico |
|---|---|
| API HTTP | `openapi-v1.yaml` |
| Topics y permisos | `mqtt-topic-acl.md` |
| Telemetría | `mqtt/telemetry-envelope.v1.schema.json` |
| Estado de gateway | `mqtt/gateway-status.v1.schema.json` |
| Diagnóstico | `mqtt/gateway-diagnostics.v1.schema.json` |
| Configuración deseada | `mqtt/config-desired.v1.schema.json` |
| Configuración reportada | `mqtt/config-reported.v1.schema.json` |
| Tipos, unidades y calidad | `telemetry-data-dictionary.md` |
| Evolución compatible | `contract-versioning.md` |

## Reglas

- OpenAPI 3.1 y JSON Schema 2020-12.
- Toda operación tenant-owned lleva `tenantId` explícito en la ruta.
- El tenant efectivo se deriva de la sesión y membership; nunca de un header
  libre.
- La identidad MQTT proviene del certificado y de la asociación exclusiva del
  gateway, no del payload.
- El payload puede repetir `gatewayId` para detectar inconsistencias, pero no
  concede permisos.
- Ningún contrato incluye comandos de proceso, escritura de setpoints,
  arranque/parada ni bypass.
- Los cambios incompatibles crean una versión mayor y conviven durante una
  ventana de migración aprobada.

## Validación CI

El pipeline debe:

1. validar sintaxis OpenAPI y JSON Schema;
2. ejecutar ejemplos válidos e inválidos;
3. verificar que ningún topic `/commands` o endpoint de control aparezca;
4. detectar cambios incompatibles;
5. publicar el bundle contractual con el mismo identificador de versión que el
   artefacto de aplicación.

