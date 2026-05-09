const PASOS = [
  { num: 1, label: "Servicio"     },
  { num: 2, label: "Datos"        },
  { num: 3, label: "Fecha y hora" },
  { num: 4, label: "Confirmación" },
];

interface Props {
  pasoActual: number; // 1-4
}

export default function Stepper({ pasoActual }: Props) {
  return (
    <nav aria-label="Progreso del agendamiento" className="w-full">
      <ol className="flex items-center w-full">
        {PASOS.map((paso, i) => {
          const completado = paso.num < pasoActual;
          const activo     = paso.num === pasoActual;
          const pendiente  = paso.num > pasoActual;
          const esUltimo   = i === PASOS.length - 1;

          return (
            <li key={paso.num} className={`flex items-center ${esUltimo ? "" : "flex-1"}`}>
              {/* Círculo */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center
                    font-sans text-sm font-semibold
                    transition-all duration-300 shrink-0
                    ${completado
                      ? "bg-sgl-gold text-sgl-black"
                      : activo
                        ? "bg-sgl-gold text-sgl-black ring-4 ring-sgl-gold/25"
                        : "bg-sgl-gray border border-sgl-gray-mid/40 text-sgl-gray-mid"
                    }
                  `}
                >
                  {completado ? (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    paso.num
                  )}
                </div>

                {/* Label — oculto en móvil excepto el paso activo */}
                <span
                  className={`
                    hidden md:block font-sans text-xs whitespace-nowrap
                    transition-colors duration-300
                    ${activo ? "text-sgl-gold font-medium" : completado ? "text-sgl-gold/70" : "text-sgl-gray-mid"}
                  `}
                >
                  {paso.label}
                </span>
                {/* Label móvil solo para paso activo */}
                {activo && (
                  <span className="md:hidden font-sans text-xs text-sgl-gold font-medium whitespace-nowrap">
                    {paso.label}
                  </span>
                )}
              </div>

              {/* Línea conectora */}
              {!esUltimo && (
                <div className="flex-1 mx-2 md:mx-3 mb-5">
                  <div className="h-px w-full transition-colors duration-500"
                    style={{ background: completado ? "var(--color-sgl-gold)" : "var(--color-sgl-gray-mid)" }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
