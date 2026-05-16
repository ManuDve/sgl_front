import { useState, useEffect } from "react";

interface Props {
  appointmentId: number;
  idExterno: string;
  nombreCliente: string;
  monto: number;
  onSuccess: () => void;
  onClose: () => void;
}

type Phase = "form" | "loading" | "success";

const CODE_REGEX = /^[A-Za-z0-9\-]{4,50}$/;

function formatMonto(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(monto);
}

export default function ConfirmPaymentModal({
  appointmentId, idExterno, nombreCliente, monto, onSuccess, onClose,
}: Props) {
  const [codigo,  setCodigo]  = useState("");
  const [touched, setTouched] = useState(false);
  const [phase,   setPhase]   = useState<Phase>("form");
  const [error,   setError]   = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => onSuccess(), 1600);
    return () => clearTimeout(t);
  }, [phase, onSuccess]);

  const isValid = CODE_REGEX.test(codigo.trim());
  const hasError = touched && !isValid;

  async function handleConfirmar() {
    setTouched(true);
    if (!isValid) return;

    const token = localStorage.getItem("sgl_token");
    if (!token) { window.location.href = "/admin/login"; return; }

    setPhase("loading");
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/appointments/${appointmentId}/pago`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ codigoTransaccion: codigo.trim() }),
        }
      );

      if (res.status === 401) { localStorage.removeItem("sgl_token"); window.location.href = "/admin/login"; return; }

      const body = await res.json();
      if (!res.ok) { setError(body.message ?? "Error al confirmar el pago."); setPhase("form"); return; }

      setPhase("success");
    } catch {
      setError("No se pudo conectar con el servidor.");
      setPhase("form");
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 60, background: `rgba(0,0,0,${mounted ? 0.7 : 0})`, transition: "background 200ms ease" }}
      onClick={phase !== "loading" ? onClose : undefined}
    >
      <div
        className="bg-sgl-gray border border-sgl-gold/40 rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity:    mounted ? 1 : 0,
          transform:  mounted ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          transition: mounted
            ? "opacity 280ms cubic-bezier(0.16,1,0.3,1), transform 280ms cubic-bezier(0.16,1,0.3,1)"
            : "none",
        }}
      >
        {/* ── Success state ── */}
        {phase === "success" ? (
          <div className="flex flex-col items-center gap-5 px-8 py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center"
              style={{ animation: "fade-up 0.4s ease both" }}>
              <svg className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="font-serif text-xl font-semibold text-sgl-white">Pago confirmado</p>
              <p className="font-sans text-sm text-sgl-gray-mid mt-1">
                El agendamiento <span className="text-sgl-gold">{idExterno}</span> fue marcado como confirmado.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sgl-gold/20">
              <div>
                <h3 className="font-serif text-lg font-semibold text-sgl-white">Confirmar pago</h3>
                <p className="font-sans text-xs text-sgl-gray-mid mt-0.5">{idExterno}</p>
              </div>
              {phase !== "loading" && (
                <button onClick={onClose} aria-label="Cerrar"
                  className="text-sgl-gray-mid hover:text-sgl-white transition-colors p-1 rounded">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Resumen del agendamiento */}
              <div className="bg-sgl-black/60 rounded-lg px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-sgl-gray-mid">Cliente</span>
                  <span className="font-sans text-sm text-sgl-white">{nombreCliente}</span>
                </div>
                <div className="flex items-center justify-between border-t border-sgl-gold/10 pt-2">
                  <span className="font-sans text-xs text-sgl-gray-mid">Monto a registrar</span>
                  <span className="font-sans text-sm font-semibold text-sgl-gold">{formatMonto(monto)}</span>
                </div>
                <p className="font-sans text-xs text-sgl-gray-mid/70 pt-1">
                  El monto se registra automáticamente desde el agendamiento.
                </p>
              </div>

              {/* Campo código de transacción */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="codigo-txn" className="font-sans text-sm text-sgl-gray-mid">
                  Código de transacción
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  id="codigo-txn"
                  type="text"
                  value={codigo}
                  onChange={(e) => { setCodigo(e.target.value); if (touched) setError(""); }}
                  onBlur={() => setTouched(true)}
                  placeholder="ej: 123456789 o OPE-20260515"
                  disabled={phase === "loading"}
                  className={`bg-sgl-black border rounded-lg px-4 py-3 font-sans text-sm text-sgl-white
                    placeholder:text-sgl-gray-mid/50 focus:outline-none transition-colors duration-200
                    disabled:opacity-50 ${
                      hasError
                        ? "border-red-500 focus:border-red-400"
                        : "border-sgl-gold/40 focus:border-sgl-gold"
                    }`}
                />
                {hasError && (
                  <p className="font-sans text-xs text-red-400">
                    Mínimo 4 caracteres, solo letras, dígitos y guiones.
                  </p>
                )}
                <p className="font-sans text-xs text-sgl-gray-mid/70">
                  Número de operación/comprobante que aparece en el voucher de transferencia.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 font-sans text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-sgl-gold/10 flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                disabled={phase === "loading"}
                className="border border-sgl-gold/40 text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10
                  font-semibold rounded transition-colors duration-200 disabled:opacity-40"
                style={{ padding: "10px 24px" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={phase === "loading"}
                className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded
                  transition-colors duration-200 inline-flex items-center gap-2 disabled:opacity-60"
                style={{
                  padding: "10px 28px",
                  cursor: phase === "loading" ? "not-allowed" : "pointer",
                }}
              >
                {phase === "loading" && (
                  <span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin" />
                )}
                {phase === "loading" ? "Confirmando…" : "Confirmar pago"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
