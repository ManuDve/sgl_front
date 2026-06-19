import { useState, useEffect, useCallback } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id:          number;
  accion:      string;
  entidad:     string;
  entidadId:   string | null;
  adminEmail:  string;
  detalles:    string | null;
  fechaAccion: string;
}

interface AuditPage {
  content:       AuditEntry[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}

// ── Constantes de presentación ────────────────────────────────────────────────

const ACCION_BADGE: Record<string, string> = {
  LOGIN:          "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  CAMBIO_ESTADO:  "bg-sgl-gold/20 text-sgl-gold border border-sgl-gold/30",
  CONFIRMAR_PAGO: "bg-green-500/20 text-green-400 border border-green-500/30",
  CAMBIO_PRECIO:  "bg-purple-500/20 text-purple-400 border border-purple-500/30",
};

const ACCION_LABEL: Record<string, string> = {
  LOGIN:          "Login",
  CAMBIO_ESTADO:  "Cambio estado",
  CONFIRMAR_PAGO: "Confirmar pago",
  CAMBIO_PRECIO:  "Cambio precio",
};

const PAGE_SIZES = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZES)[number];

const API = "http://localhost:8080/api/admin/audit";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Santiago",
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-sgl-gold/10 animate-pulse">
      <td className="px-4 py-3.5">
        <div className="h-3 w-32 bg-sgl-gray-mid/20 rounded" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-5 w-24 bg-sgl-gray-mid/15 rounded-full" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3 w-24 bg-sgl-gray-mid/20 rounded" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3 w-28 bg-sgl-gray-mid/20 rounded" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3 w-40 bg-sgl-gray-mid/15 rounded" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3 w-36 bg-sgl-gray-mid/10 rounded" />
      </td>
    </tr>
  );
}

// ── Paginador ─────────────────────────────────────────────────────────────────

interface PaginatorProps {
  page:       number;
  totalPages: number;
  total:      number;
  size:       number;
  onPage:     (p: number) => void;
  pageSize:   PageSize;
  onPageSize: (s: PageSize) => void;
}

function Paginator({ page, totalPages, total, size, onPage, pageSize, onPageSize }: PaginatorProps) {
  const from = total === 0 ? 0 : page * size + 1;
  const to   = Math.min((page + 1) * size, total);

  const btnClass = (disabled: boolean) =>
    `px-3 py-1.5 rounded text-xs font-sans border transition-colors duration-150 ${
      disabled
        ? "border-sgl-gold/10 text-sgl-gray-mid/30 cursor-not-allowed"
        : "border-sgl-gold/20 text-sgl-gray-mid hover:border-sgl-gold/50 hover:text-sgl-white"
    }`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <span className="font-sans text-xs text-sgl-gray-mid">
        {total === 0 ? "Sin resultados" : `${from}–${to} de ${total} registros`}
      </span>

      <div className="flex items-center gap-2">
        <span className="font-sans text-xs text-sgl-gray-mid">Filas:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value) as PageSize)}
          className="bg-sgl-black border border-sgl-gold/20 text-sgl-white text-xs rounded px-2 py-1.5 font-sans focus:outline-none focus:border-sgl-gold/50"
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onPage(0)}
            disabled={page === 0}
            className={btnClass(page === 0)}
            title="Primera página"
          >«</button>
          <button
            onClick={() => onPage(page - 1)}
            disabled={page === 0}
            className={btnClass(page === 0)}
          >‹</button>
          <span className="font-sans text-xs text-sgl-white px-2">
            {page + 1} / {Math.max(totalPages, 1)}
          </span>
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages - 1}
            className={btnClass(page >= totalPages - 1)}
          >›</button>
          <button
            onClick={() => onPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className={btnClass(page >= totalPages - 1)}
            title="Última página"
          >»</button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AuditoriaAdmin() {
  const [data,     setData]     = useState<AuditPage | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [page,     setPage]     = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const fetchPage = useCallback((p: number, s: number) => {
    const token = localStorage.getItem("sgl_token");
    if (!token) { window.location.href = "/admin/login"; return; }

    setLoading(true);
    setError("");

    fetch(`${API}?page=${p}&size=${s}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { window.location.href = "/admin/login"; return null; }
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (json) setData(json.data);
      })
      .catch(() => setError("No se pudo cargar el historial de auditoría."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPage(page, pageSize);
  }, [page, pageSize, fetchPage]);

  const handlePageSize = (s: PageSize) => {
    setPage(0);
    setPageSize(s);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-sgl-white">
            Auditoría
          </h1>
          <p className="font-sans text-sm text-sgl-gray-mid mt-1">
            Historial de acciones administrativas del sistema
          </p>
        </div>
        <button
          onClick={() => fetchPage(page, pageSize)}
          className="flex items-center gap-2 px-4 py-2 rounded border border-sgl-gold/20 text-sgl-gray-mid text-sm font-sans transition-colors hover:border-sgl-gold/50 hover:text-sgl-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-sgl-black/50 border border-sgl-gold/15 rounded-lg overflow-hidden">
        {error && (
          <div className="px-6 py-4 text-sm font-sans text-red-400 bg-red-500/10 border-b border-red-500/20">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-sgl-gold/20">
                {["Fecha", "Acción", "Entidad", "ID Entidad", "Admin", "Detalles"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-sans text-xs uppercase tracking-wider text-sgl-gray-mid">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: pageSize > 10 ? 10 : pageSize }, (_, i) => <SkeletonRow key={i} />)
                : data?.content.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center font-sans text-sm text-sgl-gray-mid">
                      No hay registros de auditoría.
                    </td>
                  </tr>
                )
                : data?.content.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="border-b border-sgl-gold/10 transition-colors hover:bg-sgl-gold/5"
                    style={{
                      animation: `fadeUp 200ms ease both`,
                      animationDelay: `${idx * 30}ms`,
                    }}
                  >
                    {/* Fecha */}
                    <td className="px-4 py-3 font-sans text-xs text-sgl-gray-mid whitespace-nowrap">
                      {formatDateTime(entry.fechaAccion)}
                    </td>

                    {/* Acción badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans whitespace-nowrap ${ACCION_BADGE[entry.accion] ?? "bg-sgl-gray-mid/20 text-sgl-gray-mid border border-sgl-gray-mid/30"}`}>
                        {ACCION_LABEL[entry.accion] ?? entry.accion}
                      </span>
                    </td>

                    {/* Entidad */}
                    <td className="px-4 py-3 font-sans text-xs text-sgl-white">
                      {entry.entidad}
                    </td>

                    {/* ID Entidad */}
                    <td className="px-4 py-3 font-mono text-xs text-sgl-gold/80">
                      {entry.entidadId ?? <span className="text-sgl-gray-mid/40">—</span>}
                    </td>

                    {/* Admin */}
                    <td className="px-4 py-3 font-sans text-xs text-sgl-gray-mid truncate max-w-[160px]" title={entry.adminEmail}>
                      {entry.adminEmail}
                    </td>

                    {/* Detalles */}
                    <td className="px-4 py-3 font-sans text-xs text-sgl-gray-mid/70 truncate max-w-[200px]" title={entry.detalles ?? ""}>
                      {entry.detalles ?? <span className="text-sgl-gray-mid/30">—</span>}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {!loading && data && data.totalElements > 0 && (
          <div className="px-4 pb-4 pt-2 border-t border-sgl-gold/10">
            <Paginator
              page={data.page}
              totalPages={data.totalPages}
              total={data.totalElements}
              size={data.size}
              onPage={setPage}
              pageSize={pageSize}
              onPageSize={handlePageSize}
            />
          </div>
        )}
      </div>
    </section>
  );
}
