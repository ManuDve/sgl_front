import { useState } from "react";

interface Props {
  appointmentId: number;
  idExterno:     string;
  nombreCliente: string;
  onClose:       () => void;
  onSuccess:     () => void;
}

export default function CancelAppointmentModal({
  appointmentId, idExterno, nombreCliente, onClose, onSuccess,
}: Props) {
  const [cancelando, setCancelando] = useState(false);
  const [error,      setError]      = useState("");

  async function handleConfirm() {
    const token = localStorage.getItem("sgl_token");
    if (!token) { window.location.href = "/admin/login"; return; }

    setCancelando(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/appointments/${appointmentId}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado: "CANCELADO" }),
        }
      );
      if (res.status === 401) {
        localStorage.removeItem("sgl_token");
        window.location.href = "/admin/login";
        return;
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? body.error ?? "No se pudo cancelar.");
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? "No se pudo cancelar la cita.");
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="bg-sgl-gray border border-red-500/30 rounded-lg w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
            </div>
            <h2 className="font-serif text-lg font-semibold text-sgl-white">Cancelar cita</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-sgl-gray-mid hover:text-sgl-white transition-colors duration-150 p-1 rounded"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-4">
          <p className="font-sans text-sm text-sgl-white leading-relaxed">
            ¿Confirmas la cancelación de la cita{" "}
            <span className="font-semibold text-sgl-gold">{idExterno}</span>{" "}
            de{" "}
            <span className="font-semibold text-sgl-white">{nombreCliente}</span>?
          </p>
          <p className="font-sans text-xs text-sgl-gray-mid">
            Esta acción notificará al cliente y no se puede deshacer.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 font-sans text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-red-500/10">
          <button
            onClick={onClose}
            disabled={cancelando}
            style={{ opacity: cancelando ? 0.5 : 1, cursor: cancelando ? "not-allowed" : "pointer" }}
            className="border border-sgl-gold/40 text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10 font-semibold px-5 py-2 rounded text-sm transition-colors duration-200"
          >
            No, volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={cancelando}
            style={{ opacity: cancelando ? 0.6 : 1, cursor: cancelando ? "not-allowed" : "pointer" }}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded text-sm transition-colors duration-200"
          >
            {cancelando && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Sí, cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
