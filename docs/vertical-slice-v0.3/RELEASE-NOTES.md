# SOLIS IAOS V0.3.0 — notas de entrega

## Resultado

V0.3.0 incorpora el primer recorrido funcional local de telemetría sintética:

`Gateway Simulator → Mosquitto → Node-RED → InfluxDB → Grafana`.

## Incluido

- Compose independiente con cinco servicios y health checks;
- imágenes fijadas por versión;
- broker con listener interno y listener LAN autenticado;
- ACL limitada al tenant y gateway configurados;
- simulador determinista de presión, caudal, nivel y estado de bomba;
- publicación MQTT 5 con QoS 1;
- validación de topic, envelope, UUID, tipo, calidad y valor en Node-RED;
- conversión a InfluxDB Line Protocol;
- persistencia idempotente por identidad de punto en el alcance del prototipo;
- registro de payloads rechazados;
- datasource y dashboard Grafana provisionados;
- scripts PowerShell de inicio, smoke y detención;
- verificación estática sin dependencias mediante `node tools/scripts/check-mvp.mjs`;
- ADR y runbook del incremento.

## Validación realizada en el entorno de construcción

- JSON de Node-RED y Grafana válido;
- YAML sintácticamente válido;
- scripts POSIX con sintaxis válida;
- función Node-RED compilada y probada con mensaje contractual positivo;
- mensaje inválido dirigido al registro de rechazos;
- cinco paneles Grafana detectados;
- imágenes sin etiqueta `latest`;
- servicios administrativos ligados a localhost;
- checksum del paquete regenerado.

## Evidencia pendiente en el computador del usuario

Este entorno de construcción no dispone de Docker. El cierre dinámico requiere:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-start.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\mvp-smoke.ps1
```

## Limitaciones conocidas

- credenciales de laboratorio, no secretos productivos;
- MQTT LAN todavía sin TLS;
- un tenant y un gateway;
- no hay buffer store-and-forward;
- InfluxDB es un historial de prototipo;
- no hay conexión OT, PLC, datos reales, control remoto ni AWS;
- el dashboard usa el bucket canónico `solis_telemetry` de `.env.mvp.example`.

## Próxima versión sugerida

V0.3.1 debe incorporar la evidencia Docker del equipo del usuario, corregir
cualquier incompatibilidad real de imagen/plataforma y demostrar persistencia
tras reinicio antes de conectar un gateway físico.
