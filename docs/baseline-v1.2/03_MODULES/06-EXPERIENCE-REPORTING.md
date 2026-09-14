# Módulos Experience y Reporting Basic

## Estado MVP

Incluidos con alcance restringido.

## Experience

Responsabilidades:

- navegación tenant/site;
- dashboard de sitio;
- inventario;
- vista de activo;
- conectividad;
- tendencias;
- alarmas;
- administración según rol;
- estados de error y datos degradados.

La UI no implementa reglas de autorización ni calcula el estado operativo
autoritativo.

## Reporting Basic

Incluye:

- CSV de histórico dentro de límites;
- CSV de alarmas;
- reporte operacional fijo del piloto;
- metadata de generación;
- job y estado cuando la operación sea larga.

No incluye diseñador de reportes, Excel genérico ni catálogo de plantillas
multiindustria.

## Contratos

- HTTP para consultas;
- WebSocket para cambios;
- recuperación por HTTP tras reconexión;
- zona horaria de presentación separada de UTC persistido;
- unidades explícitas.

## Cambios respecto de V1.0

- móvil no equivale a escritorio;
- color no es el único indicador;
- cada muestra no llega al navegador;
- documentos y mantenimiento no aparecen como módulos vacíos del MVP;
- reporte se reduce a una salida fija y CSV.

## Pruebas críticas

- usuario con múltiples tenants;
- reconexión;
- datos stale/bad/no data;
- gráfico con límite de puntos;
- exportación demasiado amplia;
- autorización de acknowledgement;
- accesibilidad y tablet.

