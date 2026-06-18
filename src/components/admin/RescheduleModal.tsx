import { useState } from "react";
import PasoFechaHora, { type FechaHoraSeleccion } from "../agendar/PasoFechaHora";

interface Props {
  appointmentId: number;
  idExterno:     string;
  nombreCliente: string;
  servicioId:    number;
  materia:       string;
  monto:         number;
  onClose:       () => void;
  onSuccess:     () => void;
}

export default function RescheduleModal({
  appointmentId, idExterno, nombreCliente,
  servicioId, materia, monto,
  onClose, onSuccess,
}: Props) {
  const [enviando, setEnviando] = useState(false);
  const [error,    setError]    = useState("");

  async function handleReagendar(sel: FechaHoraSeleccion) {
    const token = localStorage.getItem("sgl_token");
    if (!token) { window.location.href = "/admin/login"; return; }

    setEnviando(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/appointments/${appointmentId}/reagendar`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fecha: sel.fecha, hora: `${sel.hora}:00` }),
        }
      );
      if (res.status === 401) {
        localStorage.removeItem("sgl_token");
        window.location.href = "/admin/login";
        return;
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? body.message ?? "No se pudo reagendar.");
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? "No se pudo reagendar la cita.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="bg-sgl-gray border border-sgl-gold/30 rounded-lg w-full max-w-2xl my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sgl-gold/20">
          <div>
            <h2 className="font-serif text-lg font-semibold text-sgl-white">Reagendar cita</h2>
            <p className="font-sans text-xs text-sgl-gray-mid mt-0.5">
              {nombreCliente} · {idExterno}
            </p>
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
        <div className="px-6 py-5">
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 font-sans text-sm">
              {error}
            </div>
          )}

          {enviando ? (
            <div className="flex items-center justify-center gap-3 py-20 text-sgl-gray-mid font-sans text-sm">
              <span className="w-5 h-5 border-2 border-sgl-gold/40 border-t-sgl-gold rounded-full animate-spin" />
              Reagendando cita…
            </div>
          ) : (
            <PasoFechaHora
              servicio={{ id: servicioId, nombre: materia, precio: monto }}
              onContinuar={handleReagendar}
              onAtras={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
