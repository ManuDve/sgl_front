import { useState, useEffect } from "react";

// ── Tipos ──────────────────────────────────────────────────────

interface Service {
  id: number;
  name: string;
  price: number;
}

interface HistoryEntry {
  id: number;
  precioAnterior: number;
  precioNuevo: number;
  fechaCambio: string;
}

interface Props {
  service: Service;
  onSuccess: () => void;
  onClose: () => void;
}

type Phase = "idle" | "loading" | "success";

// ── Helpers ────────────────────────────────────────────────────

function formatCLP(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Componente ─────────────────────────────────────────────────

export default function EditPriceModal({ service, onSuccess, onClose }: Props) {
  const [precio,         setPrecio]         = useState(String(Math.round(service.price)));
  const [touched,        setTouched]        = useState(false);
  const [phase,          setPhase]          = useState<Phase>("idle");
  const [error,          setError]          = useState("");
  const [history,        setHistory]        = useState<HistoryEntry[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError,   setHistoryError]   = useState("");
  const [mounted,        setMounted]        = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sgl_token");
    if (!token) return;
    fetch(`http://localhost:8080/api/admin/services/${service.id}/historial-precios`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((body) => setHistory(body.data ?? []))
      .catch(() => setHistoryError("No se pudo cargar el historial."))
      .finally(() => setHistoryLoading(false));
  }, [service.id]);

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => onSuccess(), 1600);
    return () => clearTimeout(t);
  }, [phase, onSuccess]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && phase !== "loading") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const precioNum  = Math.floor(Number(precio));
  const isValidNum = precio !== "" && !isNaN(precioNum) && precioNum >= 5000;
  const hasError   = touched && !isValidNum;

  async function handleSubmit() {
    setTouched(true);
    if (!isValidNum) return;

    const token = localStorage.getItem("sgl_token");
    if (!token) { window.location.href = "/admin/login"; return; }

    setPhase("loading");
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/services/${service.id}/precio`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ precio: precioNum }),
        }
      );
      if (res.status === 401) {
        localStorage.removeItem("sgl_token");
        window.location.href = "/admin/login";
        return;
      }
      const body = await res.json();
      if (!res.ok) { setError(body.message ?? "Error al actualizar el precio."); setPhase("idle"); return; }
      setPhase("success");
    } catch {
      setError("No se pudo conectar con el servidor.");
      setPhase("idle");
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 50, background: `rgba(0,0,0,${mounted ? 0.7 : 0})`, transition: "background 200ms ease" }}
      onClick={phase !== "loading" ? onClose : undefined}
    >
      <div
        className="bg-sgl-gray border border-sgl-gold/40 rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity:   mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          transition: mounted
            ? "opacity 280ms cubic-bezier(0.16,1,0.3,1), transform 280ms cubic-bezier(0.16,1,0.3,1)"
            : "none",
        }}
      >
        {/* ── Estado éxito ── */}
        {phase === "success" ? (
          <div className="flex flex-col items-center gap-5 px-8 py-12">
            <div
              className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center"
              style={{ animation: "fade-up 0.4s ease both" }}
            >
              <svg className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-serif text-xl font-semibold text-sgl-white">Precio actualizado</p>
              <p className="font-sans text-sm text-sgl-gray-mid mt-1">
                El nuevo precio de <span className="text-sgl-gold">{service.name}</span> fue registrado.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sgl-gold/20">
              <div>
                <h3 className="font-serif text-lg font-semibold text-sgl-white">Actualizar precio</h3>
                <p className="font-sans text-xs text-sgl-gray-mid mt-0.5">{service.name}</p>
              </div>
              {phase !== "loading" && (
                <button onClick={onClose} aria-label="Cerrar"
                  className="text-sgl-gray-mid hover:text-sgl-white transition-colors p-1 rounded">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Precio actual */}
              <div className="bg-sgl-black/60 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="font-sans text-xs text-sgl-gray-mid">Precio actual</span>
                <span className="font-sans text-sm font-semibold text-sgl-gold">
                  {formatCLP(service.price)}
                </span>
              </div>

              {/* Campo nuevo precio — $ en flex, sin absolute */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nuevo-precio" className="font-sans text-sm text-sgl-gray-mid">
                  Nuevo precio <span className="text-red-400">*</span>
                </label>
                <div
                  className={`flex items-center bg-sgl-black border rounded-lg overflow-hidden transition-colors duration-200 ${
                    hasError ? "border-red-500" : "border-sgl-gold/40 focus-within:border-sgl-gold"
                  }`}
                >
                  <span
                    className="font-sans text-sm text-sgl-gray-mid select-none"
                    style={{ paddingLeft: "16px", paddingRight: "8px" }}
                  >
                    $
                  </span>
                  <input
                    id="nuevo-precio"
                    type="number"
                    min={5000}
                    step={1}
                    value={precio}
                    onChange={(e) => { setPrecio(e.target.value); if (touched) setError(""); }}
                    onBlur={() => setTouched(true)}
                    disabled={phase === "loading"}
                    placeholder="500000"
                    className="
                      flex-1 bg-transparent pr-4 py-3
                      font-sans text-sm text-sgl-white
                      focus:outline-none disabled:opacity-50
                      [appearance:textfield]
                      [&::-webkit-outer-spin-button]:appearance-none
                      [&::-webkit-inner-spin-button]:appearance-none
                    "
                  />
                </div>
                {hasError && (
                  <p className="font-sans text-xs text-red-400">
                    Mínimo $5.000 pesos chilenos, sin decimales.
                  </p>
                )}
                <p className="font-sans text-xs text-sgl-gray-mid/70">
                  Solo números enteros (ej: 500000).
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 font-sans text-sm">
                  {error}
                </div>
              )}

              {/* Historial de precios */}
              <div className="border-t border-sgl-gold/10 pt-4">
                <p className="font-sans text-xs font-semibold text-sgl-gray-mid uppercase tracking-wider mb-3">
                  Historial de precios
                </p>

                {historyLoading ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="h-3 w-24 bg-sgl-gray-mid/20 rounded" />
                        <div className="h-3 w-32 bg-sgl-gray-mid/15 rounded" />
                      </div>
                    ))}
                  </div>
                ) : historyError ? (
                  <p className="font-sans text-xs text-red-400/80">{historyError}</p>
                ) : !history || history.length === 0 ? (
                  <p className="font-sans text-xs text-sgl-gray-mid/50">
                    Sin historial de cambios registrados.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y divide-sgl-gold/10 max-h-32 overflow-y-auto">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-4 py-2">
                        <span className="font-sans text-xs text-sgl-gray-mid shrink-0">
                          {formatFecha(entry.fechaCambio)}
                        </span>
                        <div className="flex items-center gap-1.5 font-sans text-xs shrink-0">
                          <span className="text-sgl-gray-mid line-through">{formatCLP(entry.precioAnterior)}</span>
                          <span className="text-sgl-gray-mid">→</span>
                          <span className="text-sgl-gold font-semibold">{formatCLP(entry.precioNuevo)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 border-t border-sgl-gold/10 flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                disabled={phase === "loading"}
                className="border border-sgl-gold/40 text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10
                  font-semibold rounded transition-colors duration-200"
                style={{ padding: "10px 24px", opacity: phase === "loading" ? 0.4 : 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={phase === "loading"}
                className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded
                  transition-colors duration-200 inline-flex items-center gap-2"
                style={{
                  padding: "10px 28px",
                  opacity: phase === "loading" ? 0.7 : 1,
                  cursor: phase === "loading" ? "not-allowed" : "pointer",
                }}
              >
                {phase === "loading" && (
                  <span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin" />
                )}
                {phase === "loading" ? "Guardando…" : "Actualizar precio"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
