# Gate de seguridad AWS IoT

## Antes de emitir un certificado

- confirmar cuenta AWS nonprod y región `sa-east-1`;
- aprobar residencia de datos y presupuesto;
- definir propietario del gateway y responsable de revocación;
- verificar modelo, firmware, reloj NTP y soporte MQTT TLS del gateway;
- confirmar que el MQTT client ID sea exactamente el `gateway_id`;
- revisar policy sin comodines de tenant o gateway;
- documentar almacenamiento protegido de la clave privada;
- probar revocación y recuperación sin acceso al PLC.

## Prohibiciones

- compartir certificados entre gateways;
- guardar claves `.key`, `.pem`, `.p12` o secretos en Git;
- usar usuario IAM con access keys para CI/CD;
- exponer Mosquitto `1883` a Internet;
- introducir topics `command`, `control` o `setpoint`;
- permitir que la nube escriba al PLC.

## Evidencia del futuro FAT

- conexión MQTT TLS saliente;
- publicación QoS 1 de telemetría, status y diagnóstico;
- rechazo al usar otro client ID o topic;
- desconexión, buffer local, reconexión y replay;
- duplicados y mensajes fuera de orden observables;
- revocación del certificado efectiva.
