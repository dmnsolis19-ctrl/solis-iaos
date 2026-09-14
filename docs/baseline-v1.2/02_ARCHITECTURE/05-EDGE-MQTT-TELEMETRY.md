# Arquitectura Edge, MQTT y telemetría V1.2

## Frontera

Edge adquiere y normaliza datos. La nube almacena, contextualiza y presenta.
El control determinístico y las protecciones permanecen en PLC/SIS/equipos
locales.

## Componentes Edge

| Componente | Responsabilidad |
|---|---|
| Adapter | Leer protocolo y convertir valores |
| Mapping | Asociar dirección local a variable SOLIS |
| Buffer | Persistir muestras pendientes |
| Publisher | Publicar y gestionar confirmaciones |
| Config Manager | Aplicar versión de configuración y responder resultado |
| Health | Diagnóstico, reloj, espacio y conectividad |
| Watchdog | Reiniciar de forma controlada y registrar causa |

SQLite con WAL es el buffer local recomendado para el MVP. El límite por tiempo
y tamaño debe evitar agotar disco.

## Prioridad de protocolos

1. Simulador determinista.
2. Un adaptador real elegido para la planta piloto.
3. Adaptadores adicionales solo después de validar el contrato común.

La lista Modbus/OPC UA/EtherNet-IP/BACnet de V1.0 es roadmap, no compromiso MVP.

## Namespace MQTT v1

Topics basados en identificadores estables:

| Propósito | Patrón |
|---|---|
| Telemetría | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/telemetry` |
| Estado/LWT | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/status` |
| Diagnóstico | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/diagnostics` |
| Config deseada | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/config/desired` |
| Config reportada | `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/config/reported` |

No se usan nombres de empresa, planta, activo o variable en el topic. No existe
topic de comandos en el MVP.

## Envelope mínimo

| Campo | Regla |
|---|---|
| schema version | requerido y compatible con contrato |
| message id | único por gateway |
| gateway id | debe coincidir con identidad autenticada |
| sequence | monotónico dentro de la sesión definida |
| source time | UTC; puede declararse no confiable |
| config version | requerida |
| samples | colección acotada |
| quality | por muestra |

El certificado y ACL son la fuente de confianza para tenant/gateway. Los valores
del payload nunca amplían permisos.

## Semántica MQTT

- MQTT 5.
- QoS 1 para telemetría y eventos de estado relevantes.
- sesión persistente con expiración definida.
- LWT retained para conectividad.
- configuración deseada retained cuando corresponda.
- telemetría histórica no retained.
- límites de payload, tasa, conexiones y mensajes inflight.
- reintento con backoff y jitter.
- TLS y certificado de cliente único.

## Semántica de entrega

El sistema ofrece procesamiento **at-least-once** desde Edge al worker y efecto
idempotente en persistencia. No promete exactly-once end-to-end.

En Pilot Production AWS IoT Core entrega a SQS Standard mediante IoT Rule. La
cola puede duplicar y reordenar; no cambia la semántica anterior. El worker no
mantiene una sesión MQTT directa en producción.

Casos:

- duplicado: se ignora el efecto y se contabiliza;
- fuera de orden: se almacena, pero `latest value` respeta precedencia;
- reloj inválido: se marca calidad/clock status y se conserva tiempo de ingesta;
- mapping desconocido: se rechaza a una cola/tabla diagnóstica;
- contrato incompatible: se rechaza con métrica y alerta;
- caída de nube: Edge conserva hasta el límite del buffer;
- buffer lleno: aplica política explícita, nunca falla silenciosamente.

## Configuración

La nube publica una versión deseada; Edge valida, aplica atómicamente y reporta:

- versión recibida;
- estado `APPLIED`, `REJECTED` o `ROLLED_BACK`;
- fecha;
- motivo seguro;
- versión activa.

La actualización de configuración no incluye firmware OTA ni comandos de
proceso.

## Seguridad OT

- conexión saliente desde Edge;
- sin puertos de PLC publicados a Internet;
- credenciales por gateway;
- renovación y revocación;
- hardening del host;
- mínimos privilegios del proceso;
- logs locales rotados;
- recuperación documentada ante pérdida de credencial.

Los schemas ejecutables y ACL están en `05_CONTRACTS`.
