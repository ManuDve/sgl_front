# Guia de Estilos - SGL Frontend

## Paleta de colores

Los colores se definen en `src/styles/global.css` bajo el bloque `@theme`. No se definen en `tailwind.config.mjs`.

| Token | Hex | Uso |
|-------|-----|-----|
| `sgl-black` | `#0A0A0A` | Fondo principal |
| `sgl-white` | `#F5F5F5` | Textos sobre fondo oscuro, fondos de secciones claras |
| `sgl-gold` | `#C9A84C` | Acentos, botones principales, separadores, hover |
| `sgl-gold-light` | `#E8C97A` | Hover de botones dorados |
| `sgl-gray` | `#1A1A1A` | Fondo de cards y navbar |
| `sgl-gray-mid` | `#6B6B6B` | Textos secundarios |
| `sgl-gray-light` | `#E5E5E5` | Bordes y divisores |

## Tipografia

| Uso | Fuente | Clase Tailwind |
|-----|--------|----------------|
| Titulos (H1, H2) | Playfair Display | `font-serif` |
| Cuerpo y UI | Inter | `font-sans` |

Las fuentes se cargan desde Google Fonts en `BaseLayout.astro`.

## Escala tipografica

| Elemento | Clases |
|----------|--------|
| H1 hero | `font-serif text-4xl md:text-6xl font-bold text-sgl-white` |
| H2 seccion | `font-serif text-3xl md:text-4xl font-semibold text-sgl-white` |
| H3 card | `font-serif text-xl font-semibold text-sgl-white` |
| Parrafo | `font-sans text-base text-sgl-gray-mid leading-relaxed` |
| Label / caption | `font-sans text-sm text-sgl-gray-mid` |

## Botones

Primario (dorado):
```
bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold px-6 py-3 rounded transition-colors duration-200
```

Secundario (outline):
```
border border-sgl-gold text-sgl-gold hover:bg-sgl-gold hover:text-sgl-black font-semibold px-6 py-3 rounded transition-colors duration-200
```

Boton con estado deshabilitado: no usar `disabled:opacity-*` de Tailwind v4 porque no aplica consistentemente. Usar inline style:
```tsx
style={{ opacity: condicion ? 1 : 0.4, cursor: condicion ? "pointer" : "not-allowed" }}
```

## Cards interactivas

```
bg-sgl-gray border border-sgl-gray-light/10 rounded-lg p-6 hover:border-sgl-gold/50 transition-colors duration-200
```

Estado seleccionado via inline style:
```tsx
style={{ boxShadow: "0 0 0 2px var(--color-sgl-gold), 0 8px 32px rgba(201,168,76,0.18)" }}
```

Hover lift:
```
hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]
```

## Skeletons de carga

Se usan mientras `loading === true` en cualquier componente que haga fetch. El skeleton debe imitar la forma del contenido final, no mostrar un spinner generico.

Efecto shimmer:
```tsx
style={{
  background: "linear-gradient(90deg, #1f1f1f 0%, #2a2a2a 50%, #1f1f1f 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s ease-in-out infinite",
}}
```

El keyframe `@keyframes shimmer` esta definido en `global.css`.

## Transiciones entre pasos

El componente `StepTransition.tsx` maneja las transiciones entre pasos del formulario de agendamiento y otras pantallas multipaso.

```tsx
const [direccion, setDireccion] = useState<"forward" | "back">("forward");

<StepTransition key={paso} direction={direccion}>
  {paso === 1 && <PasoA />}
  {paso === 2 && <PasoB />}
</StepTransition>
```

- `direction="forward"`: entra desde abajo
- `direction="back"`: entra desde arriba
- Duracion: 280ms con easing `cubic-bezier(0.16, 1, 0.3, 1)`

Los keyframes `step-enter-forward` y `step-enter-back` estan en `global.css`.

## Layout y espaciado

| Elemento | Clase |
|----------|-------|
| Contenedor maximo | `max-w-6xl mx-auto px-4 md:px-8` |
| Seccion con padding | `py-16 md:py-24` |
| Gap entre cards | `gap-6 md:gap-8` |
| Separador dorado | `border-t border-sgl-gold/30` |

## Badges de estado

Los badges de estado de agendamiento siguen este patron:

```tsx
const BADGE_CLASS = {
  PENDING:     "bg-sgl-gold/20 text-sgl-gold border border-sgl-gold/30",
  CONFIRMED:   "bg-green-500/20 text-green-400 border border-green-500/30",
  CANCELLED:   "bg-red-500/20 text-red-400 border border-red-500/30",
  RESCHEDULED: "bg-sgl-gray-mid/20 text-sgl-gray-mid border border-sgl-gray-mid/30",
};
```

Aplicar con:
```
inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
```
