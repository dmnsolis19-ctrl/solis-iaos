# SOLIS IAOS V0.4.0 — Gateway Lab

## Incorporado

- diez señales sintéticas de proceso y calidad;
- heartbeat canónico en el topic `status`;
- persistencia de conectividad en InfluxDB;
- nueve paneles Grafana, incluyendo estado, temperatura, pH y turbidez;
- seis perfiles de integración no certificados;
- contrato y gate documental para futura prueba WECON H-AG;
- validación estática de telemetría, heartbeat, perfiles y dashboard;
- smoke test ampliado.

## Compatibilidad

El namespace y los JSON Schema MQTT v1 no cambian. V0.3.1 permanece como
versión estable anterior.

## Límites

Solo laboratorio sintético local. Sin PLC, red OT, control remoto, exposición
pública o AWS.
