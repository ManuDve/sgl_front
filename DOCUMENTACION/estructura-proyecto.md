# Estructura del Proyecto - SGL Frontend

## Tecnologias

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Astro | 6 | Framework base, paginas y rutas |
| React | 19 | Componentes interactivos |
| Tailwind CSS | v4 | Estilos |
| TypeScript | - | Tipado estatico |

## Estructura de archivos

```
sgl_front/
├── public/                 Archivos estaticos (favicon, etc.)
├── src/
│   ├── components/
│   │   ├── admin/          Componentes del panel de administracion
│   │   │   ├── AppointmentTable.tsx
│   │   │   ├── AppointmentDetail.tsx
│   │   │   ├── ConfirmPaymentModal.tsx
│   │   │   ├── CalendarioAdmin.tsx
│   │   │   └── ServiciosAdmin.tsx
│   │   └── agendar/        Componentes del flujo de agendamiento
│   │       ├── AgendarFlow.tsx
│   │       ├── PasoServicio.tsx
│   │       ├── PasoDatos.tsx
│   │       ├── PasoFechaHora.tsx
│   │       └── PasoResumen.tsx
│   ├── layouts/
│   │   ├── BaseLayout.astro     Publico
│   │   └── AdminLayout.astro    Panel admin (requiere sgl_token)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── agendar.astro
│   │   ├── confirmacion.astro
│   │   ├── terminos.astro
│   │   ├── privacidad.astro
│   │   └── admin/
│   │       ├── login.astro
│   │       ├── dashboard.astro
│   │       ├── calendario.astro
│   │       └── servicios.astro
│   └── styles/
│       └── global.css          Colores y fuentes via @theme (Tailwind v4)
├── .env                    Variables de entorno locales
├── astro.config.mjs
├── tailwind.config.mjs
└── tsconfig.json
```

## Flujo de agendamiento publico

1. El cliente accede a `/agendar`
2. `AgendarFlow.tsx` maneja el estado de los cuatro pasos:
   - Paso 1 (`PasoServicio.tsx`): seleccion de servicio legal
   - Paso 2 (`PasoDatos.tsx`): nombre, email, telefono y descripcion del caso
   - Paso 3 (`PasoFechaHora.tsx`): seleccion de fecha y hora disponibles
   - Paso 4 (`PasoResumen.tsx`): resumen y confirmacion
3. Al confirmar se hace un POST a `/api/appointments`
4. El sistema redirige a `/confirmacion?id={idExterno}`

## Panel de administracion

- Acceso via `/admin/login` con email y contrasena
- El token JWT se guarda en `localStorage` como `sgl_token`
- `AdminLayout.astro` verifica la existencia del token en cada pagina admin
- Las paginas admin usan componentes React con `client:load`

## Convenciones

- Archivos `.astro`: paginas y layouts (sin interactividad o con interactividad minima via scripts)
- Archivos `.tsx`: componentes interactivos cargados con `client:load` o `client:idle`
- Los colores y fuentes van en `src/styles/global.css` bajo el bloque `@theme`, no en `tailwind.config.mjs`
- Sin librerías externas para animaciones: solo clases de Tailwind y CSS inline
- Sin Redux ni Context: los componentes hacen fetch directamente con async/await
- Locale `es-CL` y zona horaria `America/Santiago` en todos los formatos de fecha y hora
- Mobile-first: clases base para movil, luego `md:` y `lg:` para pantallas mas grandes

## Variables de entorno

| Variable | Descripcion | Valor por defecto |
|----------|-------------|-------------------|
| `PUBLIC_API_URL` | URL base del backend | `http://localhost:8080/api` |
