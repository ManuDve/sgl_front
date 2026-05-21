import { useState, useEffect } from "react";

interface AppointmentSummary {
  monto: number;
  estado: string;
}

interface KPIs {
  pendientes: number;
  confirmados: number;
  cancelados: number;
  ingresos: number;
}

function computeKPIs(appointments: AppointmentSummary[]): KPIs {
  return appointments.reduce(
    (acc, apt) => {
      if (apt.estado === "PENDING")    acc.pendientes++;
      if (apt.estado === "CONFIRMED")  { acc.confirmados++; acc.ingresos += apt.monto; }
      if (apt.estado === "CANCELLED")  acc.cancelados++;
      return acc;
    },
    { pendientes: 0, confirmados: 0, cancelados: 0, ingresos: 0 }
  );
}

function formatMonto(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

interface KPICardProps {
  label: string;
  value: string;
  accent?: string;
  index?: number;
}

function KPICard({ label, value, accent = "text-sgl-white", index = 0 }: KPICardProps) {
  return (
    <div
      className="bg-sgl-gray border border-sgl-gold/10 rounded-lg px-4 py-4 md:px-5 md:py-6 flex flex-col gap-1.5 md:gap-2"
      style={{ opacity: 0, animation: `fade-up 300ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 70}ms forwards` }}
    >
      <span className="font-sans text-xs text-sgl-gray-mid uppercase tracking-wider leading-tight">
        {label}
      </span>
      <span className={`font-serif text-2xl md:text-3xl font-semibold leading-tight break-all ${accent}`}>
        {value}
      </span>
    </div>
  );
}

export default function DashboardKPIs() {
  const [kpis, setKpis] = useState<KPIs | null>(null);

  function fetchKPIs() {
    const token = localStorage.getItem("sgl_token");
    if (!token) { window.location.href = "/admin/login"; return; }

    fetch("http://localhost:8080/api/admin/appointments", {
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
      .then((body) => { if (body) setKpis(computeKPIs(body.data ?? [])); })
      .catch(() => setKpis({ pendientes: 0, confirmados: 0, cancelados: 0, ingresos: 0 }));
  }

  useEffect(() => {
    fetchKPIs();
    window.addEventListener("appointments:changed", fetchKPIs);
    return () => window.removeEventListener("appointments:changed", fetchKPIs);
  }, []);

  if (!kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-sgl-gray border border-sgl-gold/10 rounded-lg px-5 py-6 animate-pulse">
            <div className="h-3 w-20 bg-sgl-gray-mid/30 rounded mb-3" />
            <div className="h-8 w-12 bg-sgl-gray-mid/20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <KPICard label="Pendientes"  value={String(kpis.pendientes)}  accent="text-sgl-gold"  index={0} />
      <KPICard label="Confirmados" value={String(kpis.confirmados)} accent="text-green-400" index={1} />
      <KPICard label="Cancelados"  value={String(kpis.cancelados)}  accent="text-red-400"   index={2} />
      <KPICard label="Ingresos"    value={formatMonto(kpis.ingresos)}                        index={3} />
    </div>
  );
}
