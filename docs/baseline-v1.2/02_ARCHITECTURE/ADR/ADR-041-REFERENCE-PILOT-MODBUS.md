# ADR-041 — Perfil piloto de agua con Modbus

| Campo | Valor |
|---|---|
| Estado | Propuesto, condicionado a Product Owner y OT |
| Fecha | 26-07-2026 |
| Detalla | ADR-024, ADR-029 |

## Contexto

El primer protocolo y planta siguen abiertos. El equipo necesita un perfil para
contratos, simulator, FAT y sizing sin afirmar que existe permiso de conexión.

## Decisión

Usar como referencia:

- planta de agua/bombeo;
- simulator primero;
- un adaptador real Modbus TCP o Modbus RTU;
- señales exclusivamente de lectura;
- mapeo a variables SOLIS tipadas;
- máximo dos gateways;
- ningún cambio al PLC.

La planta nominal, endpoint y lista de señales requieren aprobación PO/OT antes
de Sprint 3.

## Alternativas

- OPC UA: buen candidato posterior, mayor alcance de seguridad/modelado.
- protocolo propietario PLC: se evita como primer contrato común.
- múltiples protocolos: rechazado para MVP.

## Consecuencias

- permite avanzar simulator y adapter boundary;
- Modbus carece de semántica/unidades, por lo que mapping es obligatorio;
- seguridad depende de segmentación local; Modbus nunca cruza Internet;
- el ADR no autoriza intervención en una planta real.

## Revisión

Si la planta aprobada no ofrece Modbus de solo lectura o el owner OT selecciona
otro protocolo con evidencia.

