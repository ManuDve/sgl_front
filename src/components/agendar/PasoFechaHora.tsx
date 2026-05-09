import { useState, useEffect, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
}

export interface FechaHoraSeleccion {
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
}

interface Props {
  servicio: Servicio;
  inicial?: Partial<FechaHoraSeleccion>;
  onContinuar: (seleccion: FechaHoraSeleccion) => void;
  onAtras: () => void;
}

// ─── Constants ───────────────────────────────────────────────

const DIAS_HEADER = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const DIAS_LONG = [
  "Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado",
];

// ─── Helpers ─────────────────────────────────────────────────

function getTodaySantiago(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Monday-first calendar grid: null = empty cell, number = day of month
function buildGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();      // 0=Sun
  const offset   = (firstDow + 6) % 7;                     // 0=Mon, 6=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${d} ${MESES[m - 1]} ${y}, ${DIAS_LONG[dow]}`;
}

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(precio);
}

// ─── Skeletons ───────────────────────────────────────────────

const SHIMMER = {
  background: "linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s ease-in-out infinite",
} as const;

function SkeletonGrid() {
  return (
    <>
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center py-0.5">
          <div className="w-9 h-9 rounded-full" style={SHIMMER} />
        </div>
      ))}
    </>
  );
}

function SkeletonHours() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-11 rounded-lg" style={{
          ...SHIMMER,
          animationDelay: `${i * 60}ms`,
        }} />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────

export default function PasoFechaHora({ servicio, inicial, onContinuar, onAtras }: Props) {
  const todayStr = useMemo(() => getTodaySantiago(), []);
  const [todayYear, todayMonth] = useMemo(() => {
    const [y, m] = todayStr.split("-").map(Number);
    return [y, m - 1];
  }, [todayStr]);

  const [viewYear,  setViewYear]  = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);

  const [selectedDate, setSelectedDate] = useState<string | null>(inicial?.fecha ?? null);
  const [selectedHora, setSelectedHora] = useState<string | null>(inicial?.hora  ?? null);

  const [availableDays,  setAvailableDays]  = useState<Set<string>>(new Set());
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [loadingDays,    setLoadingDays]    = useState(true);
  const [loadingHours,   setLoadingHours]   = useState(false);
  const [errorDays,      setErrorDays]      = useState("");
  const [errorHours,     setErrorHours]     = useState("");

  // Fetch días hábiles al montar (90 días desde hoy)
  useEffect(() => {
    fetch("http://localhost:8080/api/appointments/days-available?days=90")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(b => setAvailableDays(new Set<string>(b.data ?? [])))
      .catch(() => setErrorDays("No se pudieron cargar las fechas disponibles."))
      .finally(() => setLoadingDays(false));
  }, []);

  // Fetch horas al seleccionar fecha
  useEffect(() => {
    if (!selectedDate) return;
    setSelectedHora(null);
    setAvailableHours([]);
    setLoadingHours(true);
    setErrorHours("");
    fetch(`http://localhost:8080/api/appointments/hours-available?date=${selectedDate}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(b => setAvailableHours(b.data ?? []))
      .catch(() => setErrorHours("No se pudieron cargar las horas disponibles."))
      .finally(() => setLoadingHours(false));
  }, [selectedDate]);

  // Navegación de meses
  const canGoBack    = viewYear > todayYear || (viewYear === todayYear && viewMonth > todayMonth);
  const canGoForward = useMemo(() => {
    const maxDate  = new Date(todayYear, todayMonth + 3, 1);
    const nextView = new Date(viewYear, viewMonth + 1, 1);
    return nextView <= maxDate;
  }, [viewYear, viewMonth, todayYear, todayMonth]);

  function prevMonth() {
    if (!canGoBack) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (!canGoForward) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(day: number) {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    if (!availableDays.has(dateStr)) return;
    setSelectedDate(dateStr);
  }

  const grid       = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const canContinue = !!selectedDate && !!selectedHora;

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-10">

      {/* Título */}
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-sgl-white">
          Elige fecha y hora
        </h2>
        <p className="font-sans text-base text-sgl-gray-mid leading-relaxed">
          Selecciona el día y el horario que mejor se adapte a ti.
        </p>
      </div>

      {/* Resumen servicio */}
      <div className="flex items-center gap-3 bg-sgl-gray border border-sgl-gold/20 rounded-xl px-5 py-4">
        <span className="w-2 h-2 rounded-full bg-sgl-gold shrink-0" />
        <span className="font-sans text-sm text-sgl-white">{servicio.nombre}</span>
        <span className="ml-auto font-sans text-sm font-semibold text-sgl-gold">
          {formatPrecio(servicio.precio)}
        </span>
      </div>

      {errorDays && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 font-sans text-sm">
          {errorDays}
        </div>
      )}

      {/* Layout dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Columna izquierda: Calendario ── */}
        <div className="bg-sgl-gray border border-sgl-gold/10 rounded-xl p-5 flex flex-col gap-4">

          {/* Cabecera mes */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoBack}
              aria-label="Mes anterior"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sgl-gold hover:bg-sgl-gold/10 disabled:text-sgl-gray-mid/40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <span className="font-sans text-sm font-semibold text-sgl-white">
              {MESES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoForward}
              aria-label="Mes siguiente"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sgl-gold hover:bg-sgl-gold/10 disabled:text-sgl-gray-mid/40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Headers días semana */}
          <div className="grid grid-cols-7">
            {DIAS_HEADER.map(d => (
              <div key={d} className="text-center font-sans text-xs font-medium text-sgl-gray-mid/70 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grid días */}
          <div className="grid grid-cols-7 gap-y-1">
            {loadingDays
              ? <SkeletonGrid />
              : grid.map((day, i) => {
                  if (day === null) return <div key={i} />;

                  const dateStr    = toDateStr(viewYear, viewMonth, day);
                  const isAvail    = availableDays.has(dateStr);
                  const isSelected = dateStr === selectedDate;
                  const isToday    = dateStr === todayStr;

                  return (
                    <div key={i} className="flex items-center justify-center py-0.5">
                      <button
                        type="button"
                        disabled={!isAvail}
                        onClick={() => handleDayClick(day)}
                        className={`
                          relative w-9 h-9 rounded-full flex items-center justify-center
                          font-sans text-sm transition-all duration-150
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-sgl-gold
                          ${isSelected
                            ? "bg-sgl-gold text-sgl-black font-semibold"
                            : isAvail
                              ? "border border-sgl-gold/60 text-sgl-gold hover:bg-sgl-gold/10 hover:border-sgl-gold cursor-pointer"
                              : "text-sgl-gray-mid/30 cursor-default"
                          }
                        `}
                      >
                        {day}
                        {isToday && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sgl-gold" />
                        )}
                      </button>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* ── Columna derecha: Horas ── */}
        <div className="flex flex-col gap-4">
          {!selectedDate ? (
            <div className="flex-1 flex items-center justify-center bg-sgl-gray border border-sgl-gold/10 rounded-xl p-10 text-center min-h-48">
              <div className="flex flex-col items-center gap-3">
                <svg className="w-10 h-10 text-sgl-gray-mid/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <p className="font-sans text-sm text-sgl-gray-mid leading-relaxed">
                  Selecciona un día del calendario<br />para ver los horarios disponibles.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Fecha seleccionada */}
              <div className="border-b border-sgl-gold/10 pb-4">
                <p className="font-sans text-xs text-sgl-gold uppercase tracking-widest mb-1">
                  Fecha seleccionada
                </p>
                <p className="font-serif text-xl font-semibold text-sgl-white capitalize">
                  {formatDisplayDate(selectedDate)}
                </p>
              </div>

              {/* Estado horas */}
              {loadingHours ? (
                <SkeletonHours />
              ) : errorHours ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 font-sans text-sm">
                  {errorHours}
                </div>
              ) : availableHours.length === 0 ? (
                <div className="bg-sgl-gray border border-sgl-gold/10 rounded-xl px-5 py-8 text-center">
                  <p className="font-sans text-sm text-sgl-gray-mid">
                    No hay horarios disponibles para este día.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableHours.map(hora => {
                    const sel = hora === selectedHora;
                    return (
                      <button
                        key={hora}
                        type="button"
                        onClick={() => setSelectedHora(hora)}
                        style={{
                          padding: "10px 0",
                          background: sel ? "var(--color-sgl-gold)" : "transparent",
                          color:      sel ? "var(--color-sgl-black)" : "var(--color-sgl-gold)",
                          border:     `1px solid ${sel ? "var(--color-sgl-gold)" : "rgba(201,168,76,0.5)"}`,
                        }}
                        className="rounded-lg font-sans text-sm font-medium transition-all duration-150 hover:border-sgl-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-sgl-gold"
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onAtras}
          style={{ padding: "12px 32px" }}
          className="border border-sgl-gold/40 text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10 font-semibold rounded transition-colors duration-200"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={() => canContinue && onContinuar({ fecha: selectedDate!, hora: selectedHora! })}
          style={{
            padding: "12px 40px",
            opacity: canContinue ? 1 : 0.4,
            cursor:  canContinue ? "pointer" : "not-allowed",
          }}
          className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200"
        >
          Continuar
        </button>
      </div>

    </div>
  );
}
