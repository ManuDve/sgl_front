import { useState, useEffect, useCallback } from "react";
import AppointmentDetail from "./AppointmentDetail";

// ── Tipos ─────────────────────────────────────────────────────

interface AppointmentSummary {
  id: number;
  idExterno: string;
  nombreCliente: string;
  email: string;
  materia: string;
  fecha: string;
  hora: string;
  monto: number;
  estado: string;
}

interface CalendarData {
  mes: string;
  semana: number;
  totalSemanas: number;
  desde: string;
  hasta: string;
  primera: boolean;
  ultima: boolean;
  dias: Record<string, AppointmentSummary[]>;
}

// ── Constantes ────────────────────────────────────────────────

const BADGE_CLASS: Record<string, string> = {
  PENDING:     "bg-sgl-gold/20 text-sgl-gold border border-sgl-gold/30",
  CONFIRMED:   "bg-green-500/20 text-green-400 border border-green-500/30",
  CANCELLED:   "bg-red-500/20 text-red-400 border border-red-500/30",
  RESCHEDULED: "bg-sgl-gray-mid/20 text-sgl-gray-mid border border-sgl-gray-mid/30",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDING:     "Pendiente",
  CONFIRMED:   "Confirmado",
  CANCELLED:   "Cancelado",
  RESCHEDULED: "Reagendado",
};

// Clases de grid explícitas para que Tailwind las incluya en el bundle
const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  7: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7",
};

// ── Helpers ───────────────────────────────────────────────────

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Semana del mes actual (1-indexado): ceil(día / 7)
function getCurrentWeek(): number {
  return Math.ceil(new Date().getDate() / 7);
}

function monthLabel(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });
}

function workdaysInRange(desde: string, hasta: string): string[] {
  const result: string[] = [];
  const cur = new Date(desde + "T12:00:00");
  const end = new Date(hasta + "T12:00:00");
  while (cur <= end) {
    const dow = cur.getDay(); // 0 = domingo, 6 = sábado
    if (dow !== 0 && dow !== 6) result.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

function parseDayHeader(dateStr: string): { weekday: string; day: string } {
  const d = new Date(dateStr + "T12:00:00");
  return {
    weekday: d.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", ""),
    day: String(d.getDate()),
  };
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

// ── Skeleton ──────────────────────────────────────────────────

function SkeletonDayCard() {
  return (
    <div className="h-full bg-sgl-gray border border-sgl-gold/10 rounded-lg overflow-hidden flex flex-col animate-pulse">
      <div className="px-4 py-4 border-b border-sgl-gold/10 bg-sgl-black/40">
        <div className="h-3 w-8 bg-sgl-gray-mid/30 rounded mb-3" />
        <div className="h-8 w-8 bg-sgl-gray-mid/20 rounded" />
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg p-4 border border-sgl-gold/10 bg-sgl-black/60">
            <div className="h-3 w-10 bg-sgl-gray-mid/30 rounded mb-3" />
            <div className="h-3 w-28 bg-sgl-gray-mid/20 rounded mb-2" />
            <div className="h-3 w-20 bg-sgl-gray-mid/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tarjeta de agendamiento ───────────────────────────────────

interface AptCardProps {
  apt: AppointmentSummary;
  onClick: () => void;
}

function AptCard({ apt, onClick }: AptCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full text-left bg-sgl-black border border-sgl-gold/10 rounded-lg p-4
        hover:border-sgl-gold/40 hover:-translate-y-0.5
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]
        transition-all duration-200
      "
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="font-sans text-xs font-bold text-sgl-gold tabular-nums">
          {apt.hora.slice(0, 5)}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${BADGE_CLASS[apt.estado] ?? BADGE_CLASS.PENDING}`}>
          {ESTADO_LABEL[apt.estado] ?? apt.estado}
        </span>
      </div>
      <div className="font-sans text-sm text-sgl-white truncate leading-snug">
        {apt.nombreCliente}
      </div>
      <div className="font-sans text-xs text-sgl-gray-mid truncate leading-relaxed">
        {apt.materia}
      </div>
    </button>
  );
}

// ── Columna de día ────────────────────────────────────────────

interface DayColProps {
  dateStr: string;
  appointments: AppointmentSummary[];
  onSelect: (id: number) => void;
}

function DayCol({ dateStr, appointments, onSelect }: DayColProps) {
  const { weekday, day } = parseDayHeader(dateStr);
  const today = isToday(dateStr);
  const count = appointments.length;

  return (
    <div
      className={`
        h-full bg-sgl-gray border rounded-lg overflow-hidden flex flex-col
        transition-colors duration-200
        ${today ? "border-sgl-gold/50" : "border-sgl-gold/10"}
      `}
    >
      {/* Cabecera del día */}
      <div
        className={`
          px-4 py-4 border-b
          ${today ? "bg-sgl-gold/10 border-sgl-gold/20" : "bg-sgl-black/40 border-sgl-gold/10"}
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-sans text-xs text-sgl-gray-mid uppercase tracking-widest mb-1.5">
              {weekday}
            </div>
            <div className={`font-serif text-3xl font-semibold leading-none ${today ? "text-sgl-gold" : "text-sgl-white"}`}>
              {day}
            </div>
          </div>
          {count > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sgl-gold/20 text-sgl-gold text-xs font-bold shrink-0">
              {count}
            </span>
          )}
        </div>
        {today && (
          <div className="font-sans text-xs font-semibold text-sgl-gold/80 mt-2 tracking-wide">
            Hoy
          </div>
        )}
      </div>

      {/* Lista de agendamientos */}
      <div className="p-4 flex flex-col gap-3 flex-1 min-h-[180px]">
        {count === 0 ? (
          <p className="text-center text-sm text-sgl-gray-mid/25 py-8 select-none">—</p>
        ) : (
          appointments.map((apt) => (
            <AptCard key={apt.id} apt={apt} onClick={() => onSelect(apt.id)} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────

export default function CalendarioAdmin() {
  const [mes,          setMes]          = useState(getCurrentMonth);
  const [semana,       setSemana]       = useState(getCurrentWeek);  // semana actual por defecto
  const [data,         setData]         = useState<CalendarData | null>(null);
  const [totalSemanas, setTotalSemanas] = useState<number | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [selectedId,   setSelectedId]   = useState<number | null>(null);

  const fetchCalendar = useCallback(() => {
    const token = localStorage.getItem("sgl_token");
    if (!token) { window.location.href = "/admin/login"; return; }

    setLoading(true);
    setError("");

    fetch(
      `http://localhost:8080/api/admin/appointments/calendario?mes=${mes}&semana=${semana}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("sgl_token");
          window.location.href = "/admin/login";
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((body) => {
        if (body) {
          setData(body.data);
          setTotalSemanas(body.data.totalSemanas);
        }
      })
      .catch(() => setError("No se pudo conectar con el servidor."))
      .finally(() => setLoading(false));
  }, [mes, semana]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  useEffect(() => {
    window.addEventListener("appointments:changed", fetchCalendar);
    return () => window.removeEventListener("appointments:changed", fetchCalendar);
  }, [fetchCalendar]);

  function goToPrevMonth() {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setTotalSemanas(null);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSemana(1);
  }

  function goToNextMonth() {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(y, m, 1);
    setTotalSemanas(null);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSemana(1);
  }

  function handleStatusChanged() {
    setSelectedId(null);
    fetchCalendar();
    window.dispatchEvent(new CustomEvent("appointments:changed"));
  }

  const days      = data ? workdaysInRange(data.desde, data.hasta) : [];
  const gridClass = GRID_COLS[days.length] ?? GRID_COLS[7];

  return (
    <>
      <AppointmentDetail
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChanged={handleStatusChanged}
      />

      {/* Cabecera: navegación de mes + tabs de semana */}
      <div className="flex flex-col gap-6 mb-10">

        {/* Navegación de mes */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded
              border border-sgl-gold/20 font-sans text-sm text-sgl-gray-mid
              hover:text-sgl-white hover:border-sgl-gold/40
              transition-colors duration-200
            "
          >
            ← <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* key fuerza re-animación al cambiar de mes */}
          <h2
            key={mes}
            className="font-serif text-2xl md:text-3xl font-semibold text-sgl-white capitalize text-center"
            style={{ animation: "fade-in 350ms ease-out forwards" }}
          >
            {monthLabel(mes)}
          </h2>

          <button
            type="button"
            onClick={goToNextMonth}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded
              border border-sgl-gold/20 font-sans text-sm text-sgl-gray-mid
              hover:text-sgl-white hover:border-sgl-gold/40
              transition-colors duration-200
            "
          >
            <span className="hidden sm:inline">Siguiente</span> →
          </button>
        </div>

        {/* Tabs de semana — aparecen con fade cuando hay datos */}
        {totalSemanas !== null && (
          <div
            key={`tabs-${mes}`}
            className="flex items-center gap-2.5 flex-wrap border-b border-sgl-gold/10 pb-5"
            style={{ animation: "fade-in 280ms ease-out forwards" }}
          >
            {Array.from({ length: totalSemanas }, (_, i) => i + 1).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSemana(s)}
                className={`
                  px-4 py-2 rounded font-sans text-sm font-medium
                  transition-colors duration-200
                  ${s === semana
                    ? "bg-sgl-gold text-sgl-black"
                    : "text-sgl-gray-mid border border-sgl-gold/20 hover:text-sgl-white hover:border-sgl-gold/40"
                  }
                `}
              >
                Sem {s}
              </button>
            ))}

            {data && !loading && (
              <span className="ml-auto font-sans text-xs text-sgl-gray-mid tabular-nums">
                {formatShortDate(data.desde)} — {formatShortDate(data.hasta)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grilla del calendario */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => <SkeletonDayCard key={i} />)}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-5 py-4 text-red-400 font-sans text-sm">
          {error}
        </div>
      ) : data && (
        /* key fuerza re-animación de stagger al cambiar semana o mes */
        <div key={`${data.mes}-${data.semana}`} className={`grid gap-4 ${gridClass}`}>
          {days.map((dateStr, i) => (
            <div
              key={dateStr}
              className="h-full"
              style={{
                opacity: 0,
                animation: `fade-up 320ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 55}ms forwards`,
              }}
            >
              <DayCol
                dateStr={dateStr}
                appointments={data.dias[dateStr] ?? []}
                onSelect={setSelectedId}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
