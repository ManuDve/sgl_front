import { useState, useEffect } from "react";

interface Appointment {
  idExterno: string;
  nombreCliente: string;
  materia: string;
  fecha: string;
  hora: string;
  monto: number;
  estado: string;
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function formatFecha(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DIAS[dow]} ${d} de ${MESES[m - 1]} de ${y}`;
}

function formatMonto(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(monto);
}

// Stagger animation delay for each detail row
const STAGGER = [0, 80, 160, 240, 320];

export default function ConfirmacionView() {
  const [apt,     setApt]     = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [visible, setVisible] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) { setError("No se encontró el ID de la cita."); setLoading(false); return; }

    fetch(`http://localhost:8080/api/appointments/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(b => { setApt(b.data); })
      .catch(() => setError("No se pudo cargar la confirmación. Guarda tu ID de cita."))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      });
  }, []);

  function handleCopiar() {
    navigator.clipboard.writeText(apt?.idExterno ?? "").then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-8 py-12 max-w-lg mx-auto w-full">
        <div className="w-20 h-20 rounded-full" style={{
          background: "linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite",
        }} />
        <div className="w-64 h-8 rounded-lg" style={{
          background: "linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite",
        }} />
        <div className="w-full h-48 rounded-xl" style={{
          background: "linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite",
        }} />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-lg mx-auto w-full">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-5 text-red-400 font-sans text-sm">
          {error}
        </div>
        <a href="/" className="mt-6 inline-block font-sans text-sm text-sgl-gold hover:text-sgl-gold-light transition-colors">
          ← Volver al inicio
        </a>
      </div>
    );
  }

  if (!apt) return null;

  // ── Confirmation screen ───────────────────────────────────────
  const transition = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  });

  return (
    <div className="flex flex-col items-center gap-8 max-w-lg mx-auto w-full">

      {/* Ícono de éxito */}
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.5)",
        transition: "opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" style={{
              strokeDasharray: 30,
              strokeDashoffset: visible ? 0 : 30,
              transition: "stroke-dashoffset 0.4s ease 0.3s",
            }}/>
          </svg>
        </div>
      </div>

      {/* Mensaje de éxito */}
      <div className="text-center" style={transition(100)}>
        <p className="font-serif text-2xl md:text-3xl font-semibold text-sgl-white">
          Tu consulta fue agendada
        </p>
        <p className="font-serif text-2xl md:text-3xl font-semibold text-green-400">
          exitosamente
        </p>
      </div>

      {/* ID de cita */}
      <div className="text-center" style={transition(200)}>
        <p className="font-sans text-xs text-sgl-gray-mid uppercase tracking-widest mb-2">
          ID de tu cita
        </p>
        <p className="font-mono text-4xl md:text-5xl font-bold text-sgl-gold tracking-wider">
          {apt.idExterno}
        </p>
        <p className="font-sans text-xs text-sgl-gray-mid mt-2">
          Guarda este código — lo necesitarás para consultas o cambios
        </p>
      </div>

      {/* Card de detalles */}
      <div className="w-full" style={transition(300)}>
        <div className="relative rounded-xl border border-sgl-gold/30 bg-sgl-gray overflow-hidden">
          <div className="h-px w-full" style={{
            background: "linear-gradient(90deg, transparent, var(--color-sgl-gold), transparent)",
          }} />

          <div className="p-6 flex flex-col gap-0">
            {[
              { label: "Servicio",   value: apt.materia },
              { label: "Fecha",      value: formatFecha(apt.fecha) },
              { label: "Hora",       value: apt.hora.slice(0, 5) },
              { label: "Cliente",    value: apt.nombreCliente },
              { label: "Total",      value: formatMonto(apt.monto) },
            ].map(({ label, value }, i) => (
              <div
                key={label}
                className={`flex items-center justify-between py-3 ${i < 4 ? "border-b border-sgl-gold/10" : ""}`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-12px)",
                  transition: `opacity 0.5s ease ${350 + STAGGER[i]}ms, transform 0.5s ease ${350 + STAGGER[i]}ms`,
                }}
              >
                <span className="font-sans text-sm text-sgl-gray-mid">{label}</span>
                <span className={`font-sans text-sm font-medium ${label === "Total" ? "text-sgl-gold text-base" : "text-sgl-white"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estado badge */}
      <div style={transition(600)}>
        <span className="inline-flex items-center gap-2 bg-sgl-gold/15 border border-sgl-gold/30 text-sgl-gold font-sans text-sm px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-sgl-gold animate-pulse" />
          Pendiente de pago — tienes 24 horas hábiles
        </span>
      </div>

      {/* ── Card instrucciones de pago ── */}
      <div className="w-full" style={transition(700)}>
        <div className="rounded-xl border border-sgl-gold bg-sgl-gray overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b border-sgl-gold/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sgl-gold/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-sgl-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-sgl-white">Instrucciones de pago</p>
              <p className="font-sans text-xs text-sgl-gray-mid">Transferencia bancaria — plazo 24 horas hábiles</p>
            </div>
          </div>

          {/* Filas de datos bancarios */}
          <div className="px-6 py-4 flex flex-col gap-0">
            {[
              { label: "Banco",         value: "Banco Estado" },
              { label: "Tipo de cuenta",value: "Cuenta corriente" },
              { label: "Número",        value: "123456789" },
              { label: "RUT",           value: "76.XXX.XXX-X" },
              { label: "Nombre",        value: "Estudio Jurídico SGL" },
              { label: "Monto exacto",  value: formatMonto(apt.monto), highlight: true },
              { label: "Referencia",    value: apt.idExterno, highlight: true },
            ].map(({ label, value, highlight }, i, arr) => (
              <div
                key={label}
                className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-sgl-gold/10" : ""}`}
              >
                <span className="font-sans text-xs text-sgl-gray-mid shrink-0">{label}</span>
                <span className={`font-sans text-sm font-medium ${highlight ? "text-sgl-gold" : "text-sgl-white"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Aviso plazo */}
          <div className="mx-6 mb-5 bg-sgl-gold/10 border border-sgl-gold/20 rounded-lg px-4 py-3">
            <p className="font-sans text-xs text-sgl-gold leading-relaxed">
              <strong>Importante:</strong> realiza la transferencia dentro de las próximas 24 horas hábiles.
              Usa el ID de tu cita como referencia/asunto para que podamos identificar tu pago.
            </p>
          </div>

          {/* Botón copiar ID */}
          <div style={{ padding: "8px 24px 40px 24px" }}>
            <button
              type="button"
              onClick={handleCopiar}
              className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold rounded-lg transition-all duration-200"
              style={{
                padding: "12px",
                background: copiado ? "var(--color-sgl-gold)" : "transparent",
                color:      copiado ? "var(--color-sgl-black)" : "var(--color-sgl-gold)",
                border:     `1px solid ${copiado ? "var(--color-sgl-gold)" : "rgba(201,168,76,0.5)"}`,
              }}
            >
              {copiado ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  ¡Copiado!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="8" height="9" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Copiar ID de cita ({apt.idExterno})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Volver al inicio */}
      <div style={transition(800)}>
        <a
          href="/"
          className="font-sans text-sm text-sgl-gray-mid hover:text-sgl-gold transition-colors duration-200 inline-flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver al inicio
        </a>
      </div>

    </div>
  );
}
