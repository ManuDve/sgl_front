import { useState, useEffect, useCallback } from "react";

interface AppointmentDetail {
  id: number;
  idExterno: string;
  nombreCliente: string;
  email: string;
  telefono: string;
  servicioId: number;
  materia: string;
  descripcionServicio: string;
  fecha: string;
  hora: string;
  monto: number;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

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

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

function formatMonto(monto: number): string {
  return `$${monto.toLocaleString("es-CL")}`;
}

function formatDateTime(dt: string): string {
  const d = new Date(dt);
  return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

interface FieldProps {
  label: string;
  value: string | React.ReactNode;
}

function Field({ label, value }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-xs text-sgl-gray-mid uppercase tracking-wider">
        {label}
      </span>
      <span className="font-sans text-sm text-sgl-white">{value}</span>
    </div>
  );
}

interface Props {
  id: number | null;
  onClose: () => void;
}

export default function AppointmentDetail({ id, onClose }: Props) {
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = useCallback(() => {
    setDetail(null);
    setError("");
    onClose();
  }, [onClose]);

  // Cerrar con Escape
  useEffect(() => {
    if (id === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [id, handleClose]);

  // Fetch al abrir
  useEffect(() => {
    if (id === null) return;

    const token = localStorage.getItem("sgl_token");
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    setLoading(true);
    setError("");
    setDetail(null);

    fetch(`http://localhost:8080/api/admin/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
        if (body) setDetail(body.data);
      })
      .catch(() => setError("No se pudo cargar el detalle."))
      .finally(() => setLoading(false));
  }, [id]);

  if (id === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-sgl-gray border border-sgl-gold/30 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sgl-gold/20">
          <div>
            <h2 className="font-serif text-lg font-semibold text-sgl-white">
              Detalle del agendamiento
            </h2>
            {detail && (
              <p className="font-sans text-xs text-sgl-gray-mid mt-0.5">
                {detail.idExterno}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-sgl-gray-mid hover:text-sgl-white transition-colors duration-150 p-1 rounded"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-10 text-sgl-gray-mid font-sans text-sm">
              <span className="inline-block w-4 h-4 border-2 border-sgl-gold/40 border-t-sgl-gold rounded-full animate-spin" />
              Cargando…
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 font-sans text-sm">
              {error}
            </div>
          )}

          {detail && (
            <div className="flex flex-col gap-6">

              {/* Estado */}
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    BADGE_CLASS[detail.estado] ?? BADGE_CLASS.PENDING
                  }`}
                >
                  {ESTADO_LABEL[detail.estado] ?? detail.estado}
                </span>
              </div>

              {/* Cita */}
              <section className="flex flex-col gap-3">
                <h3 className="font-sans text-xs font-semibold text-sgl-gold uppercase tracking-wider border-b border-sgl-gold/10 pb-1">
                  Cita
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Fecha"  value={formatFecha(detail.fecha)} />
                  <Field label="Hora"   value={formatHora(detail.hora)} />
                  <Field label="Monto"  value={formatMonto(detail.monto)} />
                  <Field label="ID externo" value={detail.idExterno} />
                </div>
              </section>

              {/* Cliente */}
              <section className="flex flex-col gap-3">
                <h3 className="font-sans text-xs font-semibold text-sgl-gold uppercase tracking-wider border-b border-sgl-gold/10 pb-1">
                  Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nombre"   value={detail.nombreCliente} />
                  <Field label="Teléfono" value={detail.telefono || "—"} />
                  <div className="col-span-2">
                    <Field label="Email" value={detail.email} />
                  </div>
                </div>
              </section>

              {/* Servicio */}
              <section className="flex flex-col gap-3">
                <h3 className="font-sans text-xs font-semibold text-sgl-gold uppercase tracking-wider border-b border-sgl-gold/10 pb-1">
                  Servicio
                </h3>
                <div className="flex flex-col gap-3">
                  <Field label="Materia" value={detail.materia} />
                  {detail.descripcionServicio && (
                    <Field label="Descripción" value={detail.descripcionServicio} />
                  )}
                </div>
              </section>

              {/* Auditoría */}
              <section className="flex flex-col gap-3">
                <h3 className="font-sans text-xs font-semibold text-sgl-gold uppercase tracking-wider border-b border-sgl-gold/10 pb-1">
                  Registro
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Creado"       value={formatDateTime(detail.createdAt)} />
                  <Field label="Actualizado"  value={formatDateTime(detail.updatedAt)} />
                </div>
              </section>

            </div>
          )}
        </div>

        {/* Footer */}
        {detail && (
          <div className="px-6 py-4 border-t border-sgl-gold/10 flex justify-end">
            <button
              onClick={handleClose}
              className="border border-sgl-gold text-sgl-gold hover:bg-sgl-gold hover:text-sgl-black font-semibold px-5 py-2 rounded text-sm transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
