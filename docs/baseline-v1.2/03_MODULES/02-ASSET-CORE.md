# Módulo Asset Core

## Estado MVP

Incluido. Es el núcleo de la visión Asset-First.

## Responsabilidades

- Site, Area/System y Asset;
- Asset Type;
- Asset Template y Template Version;
- Variable Definition;
- Asset Relationship;
- ciclo de vida del activo;
- códigos industriales y metadatos técnicos;
- vista de representación digital.

## Jerarquía

Tenant → Site → Area/System → Asset.

Gateway no forma parte de la jerarquía física: se relaciona mediante Connectivity.
Componentes pueden modelarse como activos o subcomponentes según identidad,
telemetría y ciclo de vida.

## Invariantes

- todo activo pertenece a un tenant y site;
- código único dentro del scope acordado;
- plantilla publicada inmutable;
- variable tipada con unidad compatible;
- relación no cruza tenants;
- retirar un activo no elimina histórico;
- migrar de plantilla exige operación explícita.

## Representación digital MVP

Vista compuesta de:

- identidad;
- jerarquía;
- versión de plantilla;
- variables;
- último valor/calidad;
- conectividad;
- alarmas;
- histórico.

No incluye simulación física, estado deseado, IA ni control.

## Fuera del módulo

- samples;
- alarm lifecycle;
- documentación binaria;
- mantenimiento;
- health score.

## Cambios respecto de V1.0

- modelo implementable con ownership;
- plantillas versionadas;
- “digital twin” acotado;
- documentos y mantenimiento se mantienen como extensiones futuras;
- jerarquía desacoplada de gateway.

## Pruebas críticas

- claves cross-tenant;
- inmutabilidad de plantilla;
- migración explícita;
- retiro sin pérdida de trazabilidad;
- unidad/tipo de variable;
- relación cíclica cuando esté prohibida por tipo.

