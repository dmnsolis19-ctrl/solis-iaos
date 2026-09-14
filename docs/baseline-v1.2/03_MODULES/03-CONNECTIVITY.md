# Módulo Connectivity

## Estado MVP

Incluido con simulador y un adaptador real.

## Responsabilidades cloud

- inventario de gateways;
- activación y retiro;
- referencia de credencial/certificado;
- devices lógicos;
- signal mappings;
- configuration versions;
- desired/reported configuration;
- conectividad y diagnóstico.

## Responsabilidades Edge

- adapters;
- adquisición;
- mapeo;
- buffer;
- publicación;
- aplicación atómica de configuración;
- health y watchdog.

## Invariantes

- gateway pertenece a un tenant/site;
- certificado identifica un gateway;
- mapping vincula una señal a variable del mismo tenant;
- configuración publicada es inmutable;
- solo una versión puede estar activa;
- retiro revoca publicación;
- configuración rechazada no reemplaza la última válida.

## Ciclo de vida

Lifecycle: `REGISTERED → ACTIVE → SUSPENDED/REVOKED → RETIRED`.

Conectividad observada: `UNKNOWN → ONLINE/STALE/OFFLINE`.

`UPDATING` de V1.0 se reemplaza por estado de aplicación de configuración. OTA
de firmware queda fuera.

## Cambios respecto de V1.0

- “control local seguro” no es responsabilidad del Edge Agent MVP;
- actualización remota se limita a configuración;
- protocolos se priorizan;
- identidad y ACL se vuelven obligatorias;
- gateway no confía en tenant declarado en payload.

## Pruebas críticas

- certificado revocado;
- mapping cross-tenant;
- configuración inválida y rollback;
- LWT;
- disco/buffer lleno;
- reloj incorrecto;
- reconexión y replay.
