# Plan de aceptación de planta piloto

## Perfil de referencia

Mientras el Product Owner confirma la planta nominal, el diseño usa:

- industria de agua/bombeo;
- un site;
- hasta dos gateways;
- simulador determinista;
- primer adaptador real `MODBUS_TCP` o `MODBUS_RTU`;
- hasta 250 activos y 1.000 variables;
- solo lectura;
- sin cambios al PLC ni al proceso.

Este perfil es una referencia de diseño, no autorización para conectar una
planta específica.

## Datos requeridos de la planta

- nombre/código y responsable;
- diagrama de red IT/OT;
- equipo/protocolo/endpoints;
- matriz de señales de solo lectura;
- frecuencias de muestreo;
- rangos, tipos y unidades;
- zona horaria y fuente NTP;
- ventana de instalación/prueba;
- política de acceso físico/remoto;
- aceptación de residencia/retención;
- contacto de incidente.

## Evidencia industrial

| Artefacto | Responsable | Gate |
|---|---|---|
| Lista de tags | EDGE + OT | antes de mapping |
| Matriz I/O/señales | EDGE + OT | antes de FAT |
| Topología/zonas/conduits | SEC + OT | antes de conexión |
| Configuración Edge versionada | EDGE | FAT |
| Lista de alarmas | OPS + OT | antes de SAT |
| Matriz causa-efecto de software | OPS + OT | SAT |
| Parámetros finales | EDGE + OT | SAT |
| FAT firmado | QA + EDGE | antes de site |
| SAT firmado | QA + OT | cierre |
| Manual breve/runbook | equipo | cierre |

No se escribe salida física desde SOLIS IAOS.

## FAT

1. simulator reproduce escenarios;
2. adaptador lee valores conocidos;
3. tipo/unidad/escala coinciden;
4. corte de red llena y drena buffer;
5. duplicado/out-of-order no altera latest;
6. config inválida revierte;
7. certificado ajeno/revocado falla;
8. logs no muestran secretos;
9. alarmas respetan histéresis/debounce;
10. export/reporte conserva tenant.

## SAT

1. instalación aprobada y hardening;
2. conexión saliente únicamente;
3. PLC no expuesto;
4. lista de tags conciliada;
5. 8 h de ingesta nominal;
6. corte controlado y replay;
7. dashboard/estado/histórico;
8. alarma y acknowledgement auditado;
9. restore de configuración;
10. prueba negativa de segundo tenant.

## Criterios Go/No-Go beta

GO:

- siete criterios del Product Charter demostrados;
- cero hallazgos críticos abiertos;
- RPO/RTO y capacity dentro del objetivo o excepción aprobada;
- OT y PO firman SAT;
- costo mensual aceptado;
- limitaciones documentadas.

NO-GO:

- pérdida silenciosa;
- acceso cross-tenant;
- PLC expuesto;
- control remoto accidental;
- certificado/clave compartidos;
- restore fallido;
- riesgo crítico sin mitigación.

