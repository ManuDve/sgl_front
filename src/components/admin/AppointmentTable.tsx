import { useState, useEffect, useCallback, useMemo } from "react";
import AppointmentDetail from "./AppointmentDetail";

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

type TabKey     = "all" | "pending" | "confirmed" | "cancelled";
type SortDir    = "desc" | "asc";
type PageSize   = 10 | 20 | 50;

const TABS: { key: TabKey; label: string; status: string }[] = [
  { key: "all",       label: "Todos",       status: ""          },
  { key: "pending",   label: "Pendientes",  status: "PENDING"   },
  { key: "confirmed", label: "Confirmados", status: "CONFIRMED" },
  { key: "cancelled", label: "Cancelados",  status: "CANCELLED" },
];

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

const PAGE_SIZES: PageSize[] = [10, 20, 50];

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}
function formatHora(hora: string): string { return hora.slice(0, 5); }
function formatMonto(monto: number): string {
  return `$${monto.toLocaleString("es-CL")}`;
}
function dateKey(apt: AppointmentSummary): number {
  return new Date(`${apt.fecha}T${apt.hora}`).getTime();
}

// ── Paginador ─────────────────────────────────────────────────

interface PaginatorProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: PageSize;
  onPage: (p: number) => void;
}

function Paginator({ page, totalPages, total, pageSize, onPage }: PaginatorProps) {
  if (totalPages <= 1) return null;

  // Rango de páginas visibles: hasta 5, centrado en la actual
  const range: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) range.push(i);
  } else {
    range.push(1);
    if (page > 3) range.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) range.push(i);
    if (page < totalPages - 2) range.push("…");
    range.push(totalPages);
  }

  const inicio = (page - 1) * pageSize + 1;
  const fin    = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-sgl-gold/10">
      {/* Contador */}
      <span className="font-sans text-xs text-sgl-gray-mid order-2 sm:order-1">
        {inicio}–{fin} de {total} agendamiento{total !== 1 ? "s" : ""}
      </span>

      {/* Botones de página */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 rounded font-sans text-sm text-sgl-gray-mid border border-sgl-gold/20
            hover:border-sgl-gold/40 hover:text-sgl-white transition-colors duration-150
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ←
        </button>

        {/* Números — ocultos en móvil, visibles en sm+ */}
        <div className="hidden sm:flex items-center gap-1">
          {range.map((r, i) =>
            r === "…" ? (
              <span key={`e${i}`} className="px-2 font-sans text-xs text-sgl-gray-mid">…</span>
            ) : (
              <button
                key={r}
                type="button"
                onClick={() => onPage(r as number)}
                className={`min-w-[32px] px-2 py-1.5 rounded font-sans text-sm transition-colors duration-150 ${
                  r === page
                    ? "bg-sgl-gold text-sgl-black font-semibold"
                    : "text-sgl-gray-mid border border-sgl-gold/20 hover:border-sgl-gold/40 hover:text-sgl-white"
                }`}
              >
                {r}
              </button>
            )
          )}
        </div>

        {/* Compacto en móvil */}
        <span className="sm:hidden font-sans text-sm text-sgl-white px-3">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 rounded font-sans text-sm text-sgl-gray-mid border border-sgl-gold/20
            hover:border-sgl-gold/40 hover:text-sgl-white transition-colors duration-150
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────

export default function AppointmentTable() {
  const [tab,          setTab]          = useState<TabKey>("pending");
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [selectedId,   setSelectedId]   = useState<number | null>(null);
  const [sortDir,      setSortDir]      = useState<SortDir>("desc");   // más recientes primero
  const [pageSize,     setPageSize]     = useState<PageSize>(10);
  const [page,         setPage]         = useState(1);
  const [rowKey,       setRowKey]       = useState(0);

  const fetchAppointments = useCallback((currentTab: TabKey) => {
    const token = localStorage.getItem("sgl_token");
    if (!token) { window.location.href = "/admin/login"; return; }

    const status = TABS.find(t => t.key === currentTab)?.status ?? "";
    const url = status
      ? `http://localhost:8080/api/admin/appointments?status=${status}`
      : "http://localhost:8080/api/admin/appointments";

    setLoading(true);
    setError("");

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("sgl_token");
          window.location.href = "/admin/login";
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((body) => { if (body) setAppointments(body.data ?? []); })
      .catch(() => setError("No se pudo conectar con el servidor."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAppointments(tab); }, [tab, fetchAppointments]);

  function handleTabChange(newTab: TabKey) {
    setTab(newTab);
    setSelectedId(null);
    setPage(1);
  }
  function handleSortToggle() {
    setSortDir(d => d === "desc" ? "asc" : "desc");
    setPage(1);
    setRowKey(k => k + 1);
  }
  function handlePageSize(ps: PageSize) {
    setPageSize(ps);
    setPage(1);
    setRowKey(k => k + 1);
  }
  function handlePageChange(p: number) {
    setPage(p);
    setRowKey(k => k + 1);
  }
  function handleStatusChanged() {
    setSelectedId(null);
    fetchAppointments(tab);
    window.dispatchEvent(new CustomEvent("appointments:changed"));
  }

  // Ordenar client-side por fecha+hora
  const sorted = useMemo(() =>
    [...appointments].sort((a, b) =>
      sortDir === "desc" ? dateKey(b) - dateKey(a) : dateKey(a) - dateKey(b)
    ),
    [appointments, sortDir]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const tabLabel   = TABS.find(t => t.key === tab)?.label ?? "agendamientos";

  return (
    <>
      <AppointmentDetail
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChanged={handleStatusChanged}
      />

      {/* ── Tabs de estado ── */}
      <div className="flex items-center gap-0 border-b border-sgl-gold/10 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={`
              px-4 py-2.5 font-sans text-sm font-medium transition-colors duration-150
              border-b-2 -mb-px whitespace-nowrap shrink-0
              ${tab === t.key
                ? "text-sgl-white border-sgl-gold"
                : "text-sgl-gray-mid border-transparent hover:text-sgl-white hover:border-sgl-gold/30"
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Controles: orden + registros por página ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3">

        {/* Botón orden por fecha */}
        <button
          type="button"
          onClick={handleSortToggle}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-sgl-gold/30
            font-sans text-xs text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10
            transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h12M4 8h8M6 12h4"/>
          </svg>
          Fecha: {sortDir === "desc" ? "más reciente primero" : "más antigua primero"}
          <span className="ml-0.5">{sortDir === "desc" ? "↓" : "↑"}</span>
        </button>

        {/* Selector de registros por página */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs text-sgl-gray-mid">Mostrar:</span>
          {PAGE_SIZES.map(ps => (
            <button
              key={ps}
              type="button"
              onClick={() => handlePageSize(ps)}
              className={`px-2.5 py-1 rounded font-sans text-xs font-medium transition-colors duration-150 ${
                pageSize === ps
                  ? "bg-sgl-gold text-sgl-black"
                  : "border border-sgl-gold/20 text-sgl-gray-mid hover:border-sgl-gold/40 hover:text-sgl-white"
              }`}
            >
              {ps}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido ── */}
      {loading ? (
        <div className="flex items-center gap-3 py-12 text-sgl-gray-mid font-sans text-sm">
          <span className="inline-block w-4 h-4 border-2 border-sgl-gold/40 border-t-sgl-gold rounded-full animate-spin" />
          Cargando agendamientos…
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-5 py-4 text-red-400 font-sans text-sm">
          {error}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-sgl-gray border border-sgl-gold/10 rounded-lg px-6 py-10 text-center text-sgl-gray-mid font-sans text-sm">
          No hay {tabLabel.toLowerCase()} para mostrar.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-sgl-gold/10">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="bg-sgl-gray border-b border-sgl-gold/10">
                  {["ID", "Cliente", "Materia", "Fecha", "Hora", "Monto", "Estado"].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-sgl-gold uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody key={rowKey}>
                {paginated.map((apt, i) => (
                  <tr
                    key={apt.id}
                    onClick={() => setSelectedId(apt.id)}
                    style={{ opacity: 0, animation: `fade-up 240ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 35}ms forwards` }}
                    className={`border-b border-sgl-gold/10 cursor-pointer hover:bg-sgl-gold/10 ${
                      i % 2 === 0 ? "bg-sgl-black" : "bg-sgl-gray/50"
                    }`}
                  >
                    <td className="px-4 py-3 text-sgl-gray-mid whitespace-nowrap">{apt.idExterno}</td>
                    <td className="px-4 py-3 text-sgl-white whitespace-nowrap">
                      <div>{apt.nombreCliente}</div>
                      <div className="text-xs text-sgl-gray-mid">{apt.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sgl-white whitespace-nowrap">{apt.materia}</td>
                    <td className="px-4 py-3 text-sgl-white whitespace-nowrap">{formatFecha(apt.fecha)}</td>
                    <td className="px-4 py-3 text-sgl-white whitespace-nowrap">{formatHora(apt.hora)}</td>
                    <td className="px-4 py-3 text-sgl-white whitespace-nowrap">{formatMonto(apt.monto)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE_CLASS[apt.estado] ?? BADGE_CLASS.PENDING}`}>
                        {ESTADO_LABEL[apt.estado] ?? apt.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          <Paginator
            page={safePage}
            totalPages={totalPages}
            total={sorted.length}
            pageSize={pageSize}
            onPage={handlePageChange}
          />
        </>
      )}
    </>
  );
}
