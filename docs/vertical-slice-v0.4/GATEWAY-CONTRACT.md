# Contrato de integración de gateways V0.4

V0.4 reutiliza el contrato MQTT v1 canónico. El origen industrial queda detrás
de un adaptador y no aparece en los topics.

## Topics

- Telemetría: `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/telemetry`
- Estado: `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/status`
- Diagnóstico: `solis/v1/tenants/{tenantId}/gateways/{gatewayId}/diagnostics`

No existe topic de comandos.

## Capas

1. El sensor 4–20 mA llega a una entrada analógica de PLC/E/S remota.
2. El PLC escala la señal o expone su valor crudo.
3. Un adaptador de solo lectura obtiene tags/registros por S7, Modbus,
   EtherNet/IP u otro protocolo aprobado.
4. El gateway normaliza cada lectura al envelope MQTT v1.
5. SOLIS valida identidad, contrato, tipo, unidad y calidad.

## Calidad

`GOOD`, `UNCERTAIN`, `BAD` y `NO_DATA` son estados canónicos. `STALE` es un
estado derivado de conectividad, no una calidad de muestra. Nunca se convierte
silenciosamente una lectura fallida en cero.

## Regla de compatibilidad

Los perfiles en `profiles/` son inventario y guía de pruebas. Los protocolos
exactos dependen de CPU, firmware, módulos, licencia y configuración. El campo
`certificationStatus` permanecerá en `UNVERIFIED` hasta completar FAT.
