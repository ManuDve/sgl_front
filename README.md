# SGL Frontend

Aplicación web del Sistema de Gestion Legal. Incluye el flujo publico de agendamiento de consultas y el panel de administración.

## Descripción del proyecto

SGL es una Plataforma de Reserva y Coordinación Jurídica. El frontend tiene dos partes: el sitio público donde los clientes pueden agendar una consulta legal sin crear una cuenta, y el panel de administración donde el equipo del estudio gestiona agendamientos, confirma pagos y administra los servicios disponibles.

El flujo de agendamiento es un formulario de cuatro pasos que guía al cliente desde la selección del servicio hasta el resumen y la confirmación. El panel admin incluye filtros, exportación a CSV, calendario de citas y gestión de precios.

## Tecnologías

- Astro 6
- React 19
- Tailwind CSS v4
- TypeScript

## Estructura del equipo

| Nombre | Rol |
|--------|-----|
| Manuel Alfaro | Desarrollador |

## Tablero Kanban

https://gestor-legal.atlassian.net/jira/software/projects/DEV/boards/1

## Confluence

https://gestor-legal.atlassian.net/wiki/spaces/~7120201ea05b60bb4f43c98ac238acf9179f38/pages/edit-v2/17268737

La documentacion adicional esta disponible en la carpeta `DOCUMENTACION/`.

## Requisitos

- Node.js 22.12.0 o superior

## Configuracion local

**1. Instalar dependencias**

```bash
npm install
```

**2. Variables de entorno**

Crear un archivo `.env` en la raiz del proyecto con:

```
PUBLIC_API_URL=http://localhost:8080/api
```

**3. Ejecutar**

```bash
npm run dev
```

La aplicación queda disponible en http://localhost:4321. Requiere que el backend este corriendo en http://localhost:8080.

## Build de produccion

```bash
npm run build
```

La salida queda en la carpeta `dist/` lista para servirse como archivos estáticos.
