import { useState, useEffect } from "react";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(precio);
}

/* Íconos legales — se asignan por índice de forma circular */
const ICONOS = [
  // Balanza
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M3 9l9-6 9 6M5 9l7 9 7-9M5 21h14"/>
  </svg>,
  // Documento con sello
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
  </svg>,
  // Familia
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>,
  // Moneda / Tributario
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 6v2m0 8v2"/>
  </svg>,
  // Edificio / Corporativo
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="1"/>
    <path d="M9 22V12h6v10"/>
    <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>
  </svg>,
];

/* Skeleton de una card */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-sgl-gray-light/10 bg-sgl-gray overflow-hidden">
      <div className="h-1 w-full" style={{
        background: "linear-gradient(90deg, #1A1A1A 25%, #2a2a2a 50%, #1A1A1A 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s ease-in-out infinite",
      }} />
      <div className="p-6 flex flex-col gap-4">
        <div className="w-10 h-10 rounded-lg bg-sgl-black/60" style={{
          background: "linear-gradient(90deg, #111 25%, #222 50%, #111 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s ease-in-out infinite",
        }} />
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded" style={{
            background: "linear-gradient(90deg, #222 25%, #2d2d2d 50%, #222 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s ease-in-out infinite",
          }} />
          <div className="h-4 w-full rounded" style={{
            background: "linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s ease-in-out infinite",
          }} />
          <div className="h-4 w-2/3 rounded" style={{
            background: "linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s ease-in-out infinite",
          }} />
        </div>
        <div className="h-5 w-1/3 rounded mt-auto" style={{
          background: "linear-gradient(90deg, #222 25%, #2d2d2d 50%, #222 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}

interface Props {
  onContinuar: (servicio: Servicio) => void;
}

export default function PasoServicio({ onContinuar }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [seleccionado, setSeleccionado] = useState<Servicio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/services")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((body) => setServicios(body.data ?? []))
      .catch(() => setError("No se pudieron cargar los servicios. Intenta nuevamente."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-10">

      {/* Título */}
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-sgl-white">
          ¿Qué servicio necesitas?
        </h2>
        <p className="font-sans text-base text-sgl-gray-mid leading-relaxed">
          Elige la materia legal que mejor describe tu consulta.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 font-sans text-sm">
          {error}
        </div>
      )}

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : servicios.map((s, i) => {
              const activo = seleccionado?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeleccionado(s)}
                  style={activo ? {
                    boxShadow: "0 0 0 2px var(--color-sgl-gold), 0 8px 32px rgba(201,168,76,0.18)",
                    transform: "translateY(-2px)",
                  } : undefined}
                  className={`
                    group relative rounded-xl border text-left flex flex-col overflow-hidden
                    bg-sgl-gray transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-sgl-gold
                    ${activo
                      ? "border-sgl-gold"
                      : "border-sgl-gray-light/10 hover:border-sgl-gold/40 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                    }
                  `}
                >
                  {/* Barra accent superior */}
                  <div className={`h-0.5 w-full transition-all duration-300 ${
                    activo ? "bg-sgl-gold" : "bg-transparent group-hover:bg-sgl-gold/30"
                  }`} />

                  <div className="p-6 flex flex-col gap-4 flex-1">
                    {/* Ícono */}
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      transition-colors duration-200
                      ${activo
                        ? "bg-sgl-gold/20 text-sgl-gold"
                        : "bg-sgl-black/50 text-sgl-gray-mid group-hover:text-sgl-gold/70 group-hover:bg-sgl-gold/10"
                      }
                    `}>
                      <div className="w-5 h-5">
                        {ICONOS[i % ICONOS.length]}
                      </div>
                    </div>

                    {/* Nombre */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`
                        font-serif text-xl font-semibold leading-snug transition-colors duration-200
                        ${activo ? "text-sgl-white" : "text-sgl-white group-hover:text-sgl-white"}
                      `}>
                        {s.nombre}
                      </h3>
                      {/* Badge seleccionado */}
                      <span className={`
                        shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                        transition-all duration-200
                        ${activo
                          ? "bg-sgl-gold scale-100 opacity-100"
                          : "bg-transparent scale-75 opacity-0"
                        }
                      `}>
                        <svg className="w-3 h-3 text-sgl-black" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>

                    {/* Descripción */}
                    {s.descripcion && (
                      <p className="font-sans text-sm text-sgl-gray-mid leading-relaxed">
                        {s.descripcion}
                      </p>
                    )}

                    {/* Precio */}
                    <p className={`
                      font-sans text-sm font-semibold mt-auto pt-2 border-t
                      transition-colors duration-200
                      ${activo
                        ? "text-sgl-gold border-sgl-gold/20"
                        : "text-sgl-gray-mid border-sgl-gray-light/10 group-hover:text-sgl-gold/80"
                      }
                    `}>
                      Desde {formatPrecio(s.precio)}
                    </p>
                  </div>
                </button>
              );
            })}
      </div>

      {/* Botón continuar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => seleccionado && onContinuar(seleccionado)}
          style={{
            padding: "12px 40px",
            opacity: seleccionado ? 1 : 0.4,
            cursor: seleccionado ? "pointer" : "not-allowed",
          }}
          className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
