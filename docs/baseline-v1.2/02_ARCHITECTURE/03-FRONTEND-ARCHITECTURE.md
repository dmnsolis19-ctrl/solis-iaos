# Arquitectura frontend

## Objetivo

Aplicación web industrial clara, auditable y segura para desktop y tablet.
Móvil se limita a consulta y reconocimiento autorizado.

## Stack recomendado

- React y TypeScript;
- Vite;
- router con autorización por ruta;
- librería de estado remoto con caché;
- ECharts para tendencias;
- sistema de componentes accesible;
- WebSocket administrado por una única capa de tiempo real.

No se utilizarán microfrontends durante el MVP.

## Organización por funcionalidades

| Feature | Vistas |
|---|---|
| Session | acceso, sesión expirada, cambio de contexto |
| Tenant/Site | selector autorizado y resumen |
| Assets | árbol, inventario, detalle y variables |
| Connectivity | gateways, estado y diagnóstico |
| Telemetry | último valor, calidad, tendencias |
| Alarms | bandeja, detalle, reconocimiento e historial |
| Administration | memberships, roles, sitios y auditoría |
| Reporting | exportación CSV y reporte fijo |

## Estado de datos

- Los datos remotos permanecen en la caché de consultas.
- El estado global se limita a sesión, contexto tenant/site y preferencias.
- No se copian respuestas de API a múltiples stores.
- El WebSocket invalida o actualiza consultas concretas.
- Toda vista distingue `loading`, `empty`, `error`, `stale` y `unauthorized`.

## Tiempo real e históricos

| Necesidad | Canal |
|---|---|
| Último estado | WebSocket con throttling |
| Alarmas | WebSocket + recuperación por HTTP |
| Histórico | HTTP paginado/agregado |
| Exportación | Job HTTP con estado |
| Reconexión | Rehidratación por HTTP |

Después de una desconexión, el cliente no presupone continuidad del stream:
consulta el estado autoritativo.

## Semántica visual

Estados de dato:

- `online`: dato dentro del umbral de frescura;
- `stale`: último dato conocido demasiado antiguo;
- `offline`: fuente declarada desconectada;
- `bad quality`: fuente conectada con calidad inválida;
- `no data`: no existe muestra válida.

Severidad y estado utilizan texto, icono y forma además de color. Verde no
significa automáticamente “seguro”; significa únicamente el estado definido
por la regla.

## Seguridad de interfaz

- Ocultar una acción no es autorización.
- Backend valida todas las operaciones.
- Los scopes recibidos se usan para navegación, no como fuente de verdad.
- No se almacena token en ubicaciones accesibles innecesariamente.
- Los mensajes de error no exponen secretos, SQL ni topología interna.
- Reconocer una alarma requiere confirmación, comentario si la política lo exige
  y respuesta auditada.

## Rendimiento

- limitar puntos de gráfico según ancho e intervalo;
- usar agregados del servidor;
- virtualizar listas grandes;
- cancelar consultas obsoletas;
- no abrir un WebSocket por widget;
- preservar navegación útil con conectividad degradada.

## Accesibilidad

Objetivo WCAG 2.2 AA para la aplicación web donde sea aplicable:

- navegación por teclado;
- foco visible;
- contraste;
- etiquetas y estados para lectores;
- no depender solo de color;
- reducción de movimiento;
- zonas táctiles apropiadas en tablet.

