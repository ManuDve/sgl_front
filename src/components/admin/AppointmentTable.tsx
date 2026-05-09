import { useState, useEffect } from "react";

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

export default function AppointmentTable() {
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sgl_token");
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    fetch("http://localhost:8080/api/admin/appointments?status=pending", {
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
        if (body) setAppointments(body.data ?? []);
      })
      .catch(() => setError("No se pudo conectar con el servidor."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-sgl-gray-mid font-sans text-sm">
        <span className="inline-block w-4 h-4 border-2 border-sgl-gold/40 border-t-sgl-gold rounded-full animate-spin" />
        Cargando agendamientos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-5 py-4 text-red-400 font-sans text-sm">
        {error}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-sgl-gray border border-sgl-gold/10 rounded-lg px-6 py-10 text-center text-sgl-gray-mid font-sans text-sm">
        No hay agendamientos pendientes.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-sgl-gold/10">
      <table className="w-full font-sans text-sm">
        <thead>
          <tr className="bg-sgl-gray border-b border-sgl-gold/10">
            {["ID", "Cliente", "Materia", "Fecha", "Hora", "Monto", "Estado"].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold text-sgl-gold uppercase tracking-wider whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt, i) => (
            <tr
              key={apt.id}
              className={`border-b border-sgl-gold/10 transition-colors duration-150 hover:bg-sgl-gold/5 ${
                i % 2 === 0 ? "bg-sgl-black" : "bg-sgl-gray/50"
              }`}
            >
              <td className="px-4 py-3 text-sgl-gray-mid whitespace-nowrap">
                {apt.idExterno}
              </td>
              <td className="px-4 py-3 text-sgl-white whitespace-nowrap">
                <div>{apt.nombreCliente}</div>
                <div className="text-xs text-sgl-gray-mid">{apt.email}</div>
              </td>
              <td className="px-4 py-3 text-sgl-white whitespace-nowrap">
                {apt.materia}
              </td>
              <td className="px-4 py-3 text-sgl-white whitespace-nowrap">
                {formatFecha(apt.fecha)}
              </td>
              <td className="px-4 py-3 text-sgl-white whitespace-nowrap">
                {formatHora(apt.hora)}
              </td>
              <td className="px-4 py-3 text-sgl-white whitespace-nowrap">
                {formatMonto(apt.monto)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    BADGE_CLASS[apt.estado] ?? BADGE_CLASS.PENDING
                  }`}
                >
                  {ESTADO_LABEL[apt.estado] ?? apt.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
