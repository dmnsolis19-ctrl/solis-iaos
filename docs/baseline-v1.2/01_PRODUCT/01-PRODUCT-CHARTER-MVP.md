# Product Charter — MVP SOLIS IAOS

## Visión preservada

SOLIS IAOS es la capa superior de inteligencia y gestión del activo industrial.
No reemplaza PLC, SCADA, SIS, protecciones eléctricas, ERP ni CMMS existentes.
Integra el contexto del activo, su conectividad, telemetría, eventos y alarmas
para mejorar visibilidad y diagnóstico.

## Usuario inicial

El MVP se orienta a empresas industriales medianas y a los integradores que
conectan y administran sus plantas.

Usuarios primarios:

- administrador de tenant;
- ingeniero integrador;
- operador o supervisor de planta;
- mantenedor con acceso de consulta;
- auditor con acceso de solo lectura.

## Problema

La información de activos, estado y alarmas se encuentra fragmentada entre
equipos, planillas y sistemas locales. La pérdida de conectividad y la ausencia
de un contexto uniforme dificultan detectar, explicar y auditar eventos.

## Promesa del MVP

> Conectar una planta piloto, registrar sus activos, adquirir telemetría de
> forma resiliente, visualizar estado e históricos y gestionar alarmas
> auditables de forma segura.

## Resultado de negocio

- menor tiempo para identificar el activo y la señal afectada;
- trazabilidad de alarmas y reconocimientos;
- visibilidad remota sin exponer el PLC a Internet;
- base reutilizable para mantenimiento, documentos e IA posteriores.

## Principios no negociables

1. Asset-First.
2. Seguridad IT/OT por diseño.
3. Aislamiento multi-tenant verificable.
4. Control determinístico permanece local.
5. Telemetría tolerante a duplicados y pérdida temporal de enlace.
6. Auditoría de acciones críticas.
7. Evolución modular basada en evidencia.

## No objetivos

El MVP no pretende:

- controlar activos desde la nube;
- sustituir un SCADA o historiador certificado;
- implementar un CMMS completo;
- entregar diagnóstico autónomo mediante IA;
- soportar todos los protocolos industriales;
- operar en multi-región o con SLA Enterprise;
- automatizar billing o marketplace.

## Condición de éxito

La demo del MVP se considera válida cuando un sitio piloto:

1. registra y activa un gateway;
2. publica telemetría simulada y de un adaptador real;
3. sobrevive una interrupción de enlace sin pérdida dentro del buffer;
4. muestra estado, calidad e histórico por activo;
5. genera una alarma, permite reconocerla y conserva la auditoría;
6. demuestra aislamiento negativo entre dos tenants;
7. restaura configuración y datos críticos desde backup probado.

