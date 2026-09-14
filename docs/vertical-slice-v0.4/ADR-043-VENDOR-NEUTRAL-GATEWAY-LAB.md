# ADR-043 — Laboratorio local de gateways independiente del fabricante

| Campo | Valor |
|---|---|
| Estado | Aceptado para V0.4 local |
| Fecha | 14-09-2026 |
| Autoridad | Solicitud explícita del propietario para soportar WECON y otros gateways |
| Extiende | ADR-042 |

## Contexto

El corte V0.3 demostró MQTT → validación → InfluxDB → Grafana con un gateway
sintético. El piloto prevé PLC Siemens S7-1200/S7-1500, Mitsubishi FX5U,
Schneider Modicon y Allen-Bradley, además de instrumentos 4–20 mA y analizadores
digitales. El primer gateway físico será WECON V-BOX H-AG, pero el núcleo no
debe depender de un fabricante.

## Decisión

V0.4 mantiene sin cambios el namespace y los JSON Schema MQTT v1. Se amplía
exclusivamente el laboratorio local para:

- simular variables industriales adicionales y estados de calidad;
- procesar `status`/heartbeat además de telemetría;
- documentar perfiles de integración separados del contrato canónico;
- mostrar conectividad, calidad y variables de agua en Grafana;
- probar rutas válidas e inválidas sin conexión OT.

Un perfil describe cómo un adaptador obtiene datos; nunca modifica el envelope
MQTT. La compatibilidad de un gateway o PLC solo se declara después de una
prueba FAT documentada.

## Límites

- datos exclusivamente sintéticos;
- un gateway lógico activo por ejecución local;
- perfiles de fabricante son plantillas, no certificaciones;
- sin lectura/escritura de PLC, red OT, control remoto, AWS o exposición pública;
- Node-RED e InfluxDB siguen limitados al prototipo `infra/mvp`;
- no se agrega ningún topic de comandos.

## Gate para hardware real

Antes de conectar un PLC o instrumento deben aprobarse: modelo/firmware,
protocolo, mapa de registros o tags, segmentación de red, propietario OT,
credenciales, límites de lectura y plan FAT/SAT. La primera conexión será de
solo lectura.
