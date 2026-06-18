import { useState, useEffect } from "react";

interface Appointment {
  idExterno: string;
  nombreCliente: string;
  materia: string;
  fecha: string;
  hora: string;
  monto: number;
  estado: string;
  codigoTransaccion?: string;
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

type PagoEstado = "ok" | "rechazado" | "cancelado" | "error" | null;

export default function ConfirmacionView() {
  const [apt,           setApt]          = useState<Appointment | null>(null);
  const [idExterno,     setIdExterno]    = useState("");
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState("");
  const [visible,       setVisible]      = useState(false);
  const [copiado,       setCopiado]      = useState(false);
  const [pagoEstado,    setPagoEstado]   = useState<PagoEstado>(null);
  const [iniciandoPago, setIniciandoPago] = useState(false);
  const [errorPago,     setErrorPago]    = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id    = params.get("id");
    const pago  = params.get("pago") as PagoEstado;
    if (pago) setPagoEstado(pago);
    // Solo guardar el ID si tiene el formato esperado AG-XXXX-NNNN
    const idValido = id && id.startsWith("AG-");
    if (idValido) setIdExterno(id!);
    if (!idValido) {
      setError(
        pago
          ? "El pago fue cancelado. Si ya tenías una cita creada, busca el ID en tu correo de confirmación."
          : "No se encontró el ID de la cita."
      );
      setLoading(false);
      return;
    }

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

  async function handlePagarWebpay() {
    const id = apt?.idExterno ?? idExterno;
    if (!id) return;
    setIniciandoPago(true);
    setErrorPago("");
    try {
      const res = await fetch(
        `http://localhost:8080/api/webpay/init?idExterno=${id}`,
        { method: "POST" }
      );
      const body = await res.json();
      if (!res.ok) { setErrorPago(body.message ?? "Error al iniciar el pago."); return; }

      const { token, url } = body.data;
      // Redirigir a Transbank con form POST (requerido por el SDK)
      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;
      const input = document.createElement("input");
      input.type  = "hidden";
      input.name  = "token_ws";
      input.value = token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch {
      setErrorPago("No se pudo conectar con el servidor.");
    } finally {
      setIniciandoPago(false);
    }
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
      <div className="max-w-lg mx-auto w-full flex flex-col gap-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-5 text-red-400 font-sans text-sm">
          {error}
        </div>

        {idExterno && (
          <>
            <div className="text-center">
              <p className="font-sans text-xs text-sgl-gray-mid uppercase tracking-widest mb-2">
                ID de tu cita
              </p>
              <p className="font-mono text-4xl md:text-5xl font-bold text-sgl-gold tracking-wider">
                {idExterno}
              </p>
              <p className="font-sans text-xs text-sgl-gray-mid mt-2">
                Guarda este código — lo necesitarás para consultas o cambios
              </p>
            </div>

            <button
              type="button"
              onClick={handlePagarWebpay}
              disabled={iniciandoPago}
              className="w-full bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              style={{ padding: "14px 24px", opacity: iniciandoPago ? 0.7 : 1, cursor: iniciandoPago ? "not-allowed" : "pointer" }}
            >
              {iniciandoPago ? (
                <><span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin" />Redirigiendo a Transbank…</>
              ) : (
                <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>Reintentar pago con Webpay</>
              )}
            </button>

            {errorPago && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 font-sans text-xs">
                {errorPago}
              </div>
            )}
          </>
        )}

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
    );
  }

  if (!apt) return null;

  // ── Fuente de verdad desde el servidor ───────────────────────
  // El estado real del agendamiento decide lo que se muestra.
  // El param ?pago solo sirve para mostrar el mensaje de error correcto.
  const pagoConfirmado = apt.estado === "CONFIRMED";
  const pagoPendiente  = apt.estado === "PENDING";
  const hayError       = pagoPendiente && (pagoEstado === "rechazado" || pagoEstado === "cancelado" || pagoEstado === "error");

  const transition = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  });

  return (
    <div className="flex flex-col items-center gap-8 max-w-lg mx-auto w-full">

      {/* Ícono — verde si confirmado, rojo si error, dorado si pendiente */}
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.5)",
        transition: "opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {pagoConfirmado ? (
          <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 30, strokeDashoffset: visible ? 0 : 30, transition: "stroke-dashoffset 0.4s ease 0.3s" }}/>
            </svg>
          </div>
        ) : hayError ? (
          <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-sgl-gold/10 border-2 border-sgl-gold/40 flex items-center justify-center">
            <svg className="w-10 h-10 text-sgl-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
        )}
      </div>

      {/* Título — depende del estado real */}
      <div className="text-center" style={transition(100)}>
        {pagoConfirmado ? (
          <>
            <p className="font-serif text-2xl md:text-3xl font-semibold text-sgl-white">Consulta confirmada</p>
            <p className="font-serif text-2xl md:text-3xl font-semibold text-green-400">y pago aprobado</p>
          </>
        ) : hayError ? (
          <>
            <p className="font-serif text-2xl md:text-3xl font-semibold text-sgl-white">Consulta agendada,</p>
            <p className="font-serif text-2xl md:text-3xl font-semibold text-red-400">
              {pagoEstado === "cancelado" ? "pago cancelado" : "pago rechazado"}
            </p>
          </>
        ) : (
          <>
            <p className="font-serif text-2xl md:text-3xl font-semibold text-sgl-white">Tu consulta fue agendada</p>
            <p className="font-serif text-2xl md:text-3xl font-semibold text-sgl-gold">completa tu pago</p>
          </>
        )}
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

      {/* Badge de estado — basado en apt.estado (servidor), no en URL */}
      <div style={transition(600)}>
        {pagoConfirmado ? (
          <span className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 font-sans text-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Pago confirmado con Transbank
          </span>
        ) : hayError ? (
          <span className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 font-sans text-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {pagoEstado === "cancelado" ? "Pago cancelado — puedes reintentar" : "Pago rechazado — puedes reintentar"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 bg-sgl-gold/15 border border-sgl-gold/30 text-sgl-gold font-sans text-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-sgl-gold animate-pulse" />
            Pendiente de pago
          </span>
        )}
      </div>

      {/* ── Sección de pago — fuente de verdad: apt.estado ── */}
      <div className="w-full" style={transition(700)}>

        {/* CONFIRMADO: pago exitoso (desde servidor) */}
        {pagoConfirmado && (
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10l4 4 8-8"/>
                </svg>
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-green-400">¡Pago aprobado por Transbank!</p>
                <p className="font-sans text-xs text-sgl-gray-mid mt-0.5">
                  Tu consulta está confirmada. Recibirás un email con los detalles.
                </p>
              </div>
            </div>
            {apt.codigoTransaccion && (
              <div className="flex items-center justify-between bg-sgl-black/30 border border-sgl-gold/10 rounded-lg px-4 py-2.5">
                <span className="font-sans text-xs text-sgl-gray-mid">Código de transacción</span>
                <span className="font-mono text-sm font-medium text-sgl-white tracking-wider">
                  {apt.codigoTransaccion}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ERROR: rechazado, cancelado o error técnico — mostrar reintentar */}
        {hayError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-red-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="10" cy="10" r="8"/><path d="M10 6v4m0 4h.01"/>
                </svg>
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-red-400">
                  {pagoEstado === "cancelado" ? "Pago cancelado" : pagoEstado === "error" ? "Error en el pago" : "Pago rechazado"}
                </p>
                <p className="font-sans text-xs text-sgl-gray-mid mt-1 leading-relaxed">
                  {pagoEstado === "cancelado"
                    ? "Cancelaste el proceso. Tu cita sigue reservada — puedes pagar ahora."
                    : pagoEstado === "error"
                    ? "Ocurrió un error técnico. Tu cita sigue reservada — intenta pagar nuevamente."
                    : "El banco rechazó la transacción. Verifica los datos de tu tarjeta e intenta nuevamente."}
                </p>
              </div>
            </div>

            {errorPago && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 font-sans text-xs">{errorPago}</div>
            )}

            <button
              type="button"
              onClick={handlePagarWebpay}
              disabled={iniciandoPago}
              className="w-full bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              style={{ padding: "12px 24px", opacity: iniciandoPago ? 0.7 : 1 }}
            >
              {iniciandoPago
                ? <><span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin"/>Iniciando…</>
                : "Reintentar pago con Webpay"}
            </button>
          </div>
        )}

        {/* PENDIENTE sin error — pago aún no intentado (ej: recarga manual de la URL) */}
        {pagoPendiente && !hayError && (
          <div className="rounded-xl border border-sgl-gold bg-sgl-gray overflow-hidden">
            <div className="px-6 py-4 border-b border-sgl-gold/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sgl-gold/15 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-sgl-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                </svg>
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-sgl-white">Completa tu pago</p>
                <p className="font-sans text-xs text-sgl-gray-mid">Transbank WebpayPlus — pago seguro</p>
              </div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex items-center justify-between bg-sgl-black/40 rounded-lg px-4 py-3">
                <span className="font-sans text-xs text-sgl-gray-mid">Monto a pagar</span>
                <span className="font-sans text-base font-bold text-sgl-gold">{formatMonto(apt.monto)}</span>
              </div>
              {errorPago && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 font-sans text-xs">{errorPago}</div>
              )}
              <button
                type="button"
                onClick={handlePagarWebpay}
                disabled={iniciandoPago}
                className="w-full bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ padding: "14px 24px", opacity: iniciandoPago ? 0.7 : 1 }}
              >
                {iniciandoPago ? (
                  <><span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin"/>Redirigiendo a Transbank…</>
                ) : (
                  <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>Pagar {formatMonto(apt.monto)} con Webpay</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Copiar ID */}
        {pagoEstado !== "ok" && (
          <button
            type="button"
            onClick={handleCopiar}
            className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold rounded-lg transition-all duration-200 mt-3"
            style={{
              padding: "12px",
              background: copiado ? "var(--color-sgl-gold)" : "transparent",
              color:      copiado ? "var(--color-sgl-black)" : "var(--color-sgl-gold)",
              border:     `1px solid ${copiado ? "var(--color-sgl-gold)" : "rgba(201,168,76,0.5)"}`,
            }}
          >
            {copiado ? (
              <><svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>¡Copiado!</>
            ) : (
              <><svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="9" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>Copiar ID de cita ({apt.idExterno})</>
            )}
          </button>
        )}
      </div>

      {/* Gestionar — solo si la cita no está CANCELLED */}
      {apt.estado !== "CANCELLED" && (
        <div className="w-full" style={transition(850)}>
          <a
            href={`/gestionar?id=${apt.idExterno}`}
            className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold rounded-lg border border-sgl-gold/30 text-sgl-gold hover:border-sgl-gold/60 hover:bg-sgl-gold/5 transition-all duration-200"
            style={{ padding: "12px 24px" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            Gestionar mi cita
          </a>
        </div>
      )}

      {/* Volver al inicio */}
      <div style={transition(900)}>
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
