import { useState, useEffect } from "react";
import StepTransition from "../StepTransition";
import PasoFechaHora, { type FechaHoraSeleccion } from "../agendar/PasoFechaHora";

const API = "http://localhost:8080/api";

// ─── Types ───────────────────────────────────────────────────

interface CitaDetalle {
  idExterno: string;
  nombreCliente: string;
  email: string;
  servicioId: number;
  materia: string;
  fecha: string;
  hora: string;
  monto: number;
  estado: string;
}

// "solicitar" = pedir OTP (email/tel)
// "verificar" = ingresar código recibido
// "opciones"  = elegir qué hacer
// "fecha-hora"= seleccionar nuevo slot
// "resumen"   = confirmar cambio
// "exito"     = éxito
type Paso = "solicitar" | "verificar" | "opciones" | "fecha-hora" | "resumen" | "exito";

interface Props {}

// ─── Helpers ─────────────────────────────────────────────────

const MESES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];
const DIAS_LARGO = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function formatFecha(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DIAS_LARGO[dow]} ${d} de ${MESES[m - 1]} de ${y}`;
}
function formatHora(h: string): string { return h.slice(0, 5); }
function formatMonto(v: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);
}

// ─── Shimmer ─────────────────────────────────────────────────

const SHIMMER = {
  background: "linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s ease-in-out infinite",
} as const;

function SkeletonHeader() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-8 w-52 rounded-lg" style={SHIMMER} />
      <div className="h-4 w-72 rounded" style={{ ...SHIMMER, animationDelay: "80ms" }} />
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────

function Fila({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-sans text-sm text-sgl-gray-mid shrink-0">{label}</span>
      <span className={`font-sans text-sm text-right ${accent ? "text-sgl-gold font-semibold" : "text-sgl-white"}`}>
        {value}
      </span>
    </div>
  );
}

function CardCita({ cita, label, muted = false }: { cita: CitaDetalle; label: string; muted?: boolean }) {
  return (
    <div className={`relative rounded-xl overflow-hidden ${muted ? "border border-sgl-gray-light/10 bg-sgl-gray" : "border border-sgl-gold/40 bg-sgl-gray"}`}>
      {!muted && <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,var(--color-sgl-gold),transparent)" }} />}
      <div className="p-5 flex flex-col gap-2">
        <p className={`font-sans text-xs uppercase tracking-widest ${muted ? "text-sgl-gray-mid" : "text-sgl-gold"}`}>{label}</p>
        <p className={`font-serif text-lg font-semibold capitalize ${muted ? "text-sgl-white/50" : "text-sgl-white"}`}>
          {formatFecha(cita.fecha)}
        </p>
        <p className={`font-sans text-3xl font-bold ${muted ? "text-sgl-white/50" : "text-sgl-gold"}`}>
          {formatHora(cita.hora)}
        </p>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────

export default function GestionarFlow(_props: Props) {
  // Leemos los params en el cliente igual que ConfirmacionView
  const [idExterno, setIdExterno]   = useState("");
  const [otpFromUrl, setOtpFromUrl] = useState("");
  const [ready, setReady]           = useState(false);

  // Paso inicial se resuelve una vez que sabemos si hay ?otp=
  const [paso, setPaso]           = useState<Paso>("solicitar");
  const [direccion, setDireccion] = useState<"forward" | "back">("forward");

  const [cita, setCita]           = useState<CitaDetalle | null>(null);
  const [token, setToken]         = useState("");
  const [nuevaFechaHora, setNuevaFechaHora] = useState<FechaHoraSeleccion | null>(null);

  // Paso "solicitar"
  const [contacto, setContacto]       = useState("");
  const [solicitando, setSolicitando] = useState(false);
  const [errorSolicitar, setErrorSolicitar] = useState("");

  // Paso "verificar"
  const [otpInput, setOtpInput]       = useState("");
  const [verificando, setVerificando] = useState(false);
  const [errorVerificar, setErrorVerificar] = useState("");

  // Cita
  const [loadingCita, setLoadingCita] = useState(false);
  const [errorCita, setErrorCita]     = useState("");

  // Reagendar
  const [enviando, setEnviando]       = useState(false);
  const [errorEnvio, setErrorEnvio]   = useState("");

  // Formulario de búsqueda (cuando no hay ?id= en URL)
  const [idInput, setIdInput]         = useState("");

  function goTo(p: Paso, dir: "forward" | "back") {
    setDireccion(dir);
    setPaso(p);
  }

  // Leer params del cliente al montar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id  = params.get("id")  ?? "";
    const otp = params.get("otp") ?? "";
    setIdExterno(id);
    setOtpFromUrl(otp);
    if (otp) { setPaso("verificar"); setOtpInput(otp); }
    setReady(true);
  }, []);

  // Cargar detalle de la cita cuando tengamos el id
  useEffect(() => {
    if (!idExterno) return;
    setLoadingCita(true);
    fetch(`${API}/appointments/${idExterno}`)
      .then(r => { if (!r.ok) throw new Error("Cita no encontrada."); return r.json(); })
      .then(b => setCita(b.data))
      .catch(e => setErrorCita(e.message ?? "No se pudo cargar la cita."))
      .finally(() => setLoadingCita(false));
  }, [idExterno]);

  // Auto-verificar si el OTP vino en la URL
  useEffect(() => {
    if (otpFromUrl) doVerificar(otpFromUrl);
  }, [otpFromUrl]);

  // ── Solicitar OTP ─────────────────────────────────────────────
  async function doSolicitarOtp() {
    setSolicitando(true);
    setErrorSolicitar("");
    const esEmail = contacto.includes("@");
    const body = esEmail
      ? { email: contacto.trim(), telefono: null }
      : { email: null, telefono: contacto.trim() };
    try {
      const r = await fetch(`${API}/appointments/${idExterno}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // La API siempre retorna 200 para no revelar si la cita existe (anti-enumeración)
      if (!r.ok) { const b = await r.json(); throw new Error(b.error ?? "Error al solicitar el código."); }
      setOtpInput("");
      goTo("verificar", "forward");
    } catch (e: any) {
      setErrorSolicitar(e.message ?? "Error al solicitar el código.");
    } finally {
      setSolicitando(false);
    }
  }

  // ── Verificar OTP ─────────────────────────────────────────────
  async function doVerificar(otp: string) {
    setVerificando(true);
    setErrorVerificar("");
    try {
      const r = await fetch(`${API}/appointments/${idExterno}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error ?? "Código inválido o expirado.");
      setToken(b.data.token);
      goTo("opciones", "forward");
    } catch (e: any) {
      setErrorVerificar(e.message ?? "Código inválido o expirado.");
    } finally {
      setVerificando(false);
    }
  }

  // ── Confirmar reagendamiento ──────────────────────────────────
  async function doReagendar() {
    if (!nuevaFechaHora) return;
    setEnviando(true);
    setErrorEnvio("");
    try {
      const r = await fetch(`${API}/appointments/${idExterno}/reagendar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fecha: nuevaFechaHora.fecha, hora: `${nuevaFechaHora.hora}:00` }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error ?? "No se pudo reagendar la cita.");
      goTo("exito", "forward");
    } catch (e: any) {
      setErrorEnvio(e.message ?? "No se pudo reagendar la cita.");
    } finally {
      setEnviando(false);
    }
  }

  // ── Skeleton inicial (aún no leímos la URL) ──────────────────
  if (!ready) return null;

  // ── Sin ID en URL: formulario de búsqueda ────────────────────
  if (!idExterno) {
    return (
      <div className="flex flex-col items-center gap-8 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-sgl-gold/10 border border-sgl-gold/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-sgl-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-semibold text-sgl-white">Gestionar cita</h1>
          <p className="font-sans text-base text-sgl-gray-mid leading-relaxed max-w-sm mx-auto">
            Ingresa el ID de tu cita (formato AG-XXXX-NNNN) para reagendarla.
          </p>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-left">
            <label className="font-sans text-sm text-sgl-gray-mid">ID de tu cita</label>
            <input
              type="text"
              value={idInput}
              onChange={e => setIdInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter" && idInput.trim()) window.location.href = `/gestionar?id=${idInput.trim()}`; }}
              placeholder="AG-XXXX-0001"
              autoFocus
              className="bg-sgl-gray border border-sgl-gold/20 rounded-xl px-5 py-4 font-sans text-base text-sgl-white placeholder:text-sgl-gray-mid/30 focus:outline-none focus:border-sgl-gold/60 transition-colors duration-200"
              style={{ letterSpacing: "0.05em" }}
            />
          </div>
          <button
            type="button"
            onClick={() => { if (idInput.trim()) window.location.href = `/gestionar?id=${idInput.trim()}`; }}
            disabled={!idInput.trim()}
            style={{
              padding: "14px 40px",
              opacity: idInput.trim() ? 1 : 0.4,
              cursor:  idInput.trim() ? "pointer" : "not-allowed",
            }}
            className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200"
          >
            Continuar
          </button>
        </div>

        <p className="font-sans text-xs text-sgl-gray-mid/60 leading-relaxed max-w-xs">
          Encuentra tu ID en el correo de confirmación que recibiste al agendar.
        </p>
      </div>
    );
  }

  // ── Error fatal: cita no encontrada ──────────────────────────
  if (errorCita) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-2xl font-semibold text-sgl-white">Cita no encontrada</h2>
          <p className="font-sans text-sm text-sgl-gray-mid">{errorCita}</p>
        </div>
        <a href="/gestionar" className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold px-6 py-3 rounded transition-colors duration-200">
          Intentar con otro ID
        </a>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">

      {/* Encabezado con datos de la cita */}
      <div className="border-b border-sgl-gold/10 pb-8 flex flex-col gap-2">
        <p className="font-sans text-xs text-sgl-gold uppercase tracking-widest">Gestionar cita</p>
        {loadingCita ? (
          <SkeletonHeader />
        ) : cita ? (
          <>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-sgl-white">
              {cita.nombreCliente}
            </h1>
            <p className="font-sans text-base text-sgl-gray-mid">
              {cita.materia} · {formatFecha(cita.fecha)} a las {formatHora(cita.hora)}
            </p>
            <span className="font-sans text-xs text-sgl-gray-mid/50">{cita.idExterno}</span>
          </>
        ) : null}
      </div>

      {/* Contenido del paso activo */}
      <StepTransition key={paso} direction={direccion}>

        {/* ══ PASO: solicitar ══════════════════════════════════ */}
        {paso === "solicitar" && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="font-serif text-2xl font-semibold text-sgl-white">
                Verifica tu identidad
              </h2>
              <p className="font-sans text-sm text-sgl-gray-mid leading-relaxed">
                Ingresa el correo o teléfono que usaste al agendar y te enviaremos
                un código de verificación.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm text-sgl-gray-mid">
                Correo electrónico o teléfono
              </label>
              <input
                type="text"
                inputMode="email"
                value={contacto}
                onChange={e => { setContacto(e.target.value); setErrorSolicitar(""); }}
                onKeyDown={e => { if (e.key === "Enter" && contacto.trim()) doSolicitarOtp(); }}
                placeholder="correo@ejemplo.com o +56912345678"
                autoFocus
                className="bg-sgl-gray border border-sgl-gold/20 rounded-xl px-5 py-4 font-sans text-base text-sgl-white placeholder:text-sgl-gray-mid/30 focus:outline-none focus:border-sgl-gold/60 transition-colors duration-200"
              />
            </div>

            {errorSolicitar && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 font-sans text-sm">
                {errorSolicitar}
              </div>
            )}

            <button
              type="button"
              onClick={doSolicitarOtp}
              disabled={!contacto.trim() || solicitando}
              style={{
                padding: "14px 40px",
                opacity: contacto.trim() && !solicitando ? 1 : 0.4,
                cursor:  contacto.trim() && !solicitando ? "pointer" : "not-allowed",
              }}
              className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200 inline-flex items-center justify-center gap-2"
            >
              {solicitando && (
                <span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin" />
              )}
              {solicitando ? "Enviando código…" : "Enviar código de verificación"}
            </button>

            <p className="font-sans text-xs text-sgl-gray-mid/60 text-center leading-relaxed">
              El código tiene validez de 15 minutos y solo sirve para esta cita.
            </p>
          </div>
        )}

        {/* ══ PASO: verificar ══════════════════════════════════ */}
        {paso === "verificar" && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="font-serif text-2xl font-semibold text-sgl-white">
                Ingresa el código
              </h2>
              <p className="font-sans text-sm text-sgl-gray-mid leading-relaxed">
                {otpFromUrl && verificando
                  ? "Verificando el código de acceso…"
                  : "Revisa tu correo e ingresa el código de 6 dígitos que te enviamos."
                }
              </p>
            </div>

            {/* Spinner para auto-verificación desde URL */}
            {otpFromUrl && verificando && !errorVerificar && (
              <div className="flex items-center justify-center py-10">
                <span className="w-10 h-10 border-2 border-sgl-gold/30 border-t-sgl-gold rounded-full animate-spin" />
              </div>
            )}

            {/* Formulario OTP (siempre visible excepto cuando auto-verifica sin error) */}
            {(!otpFromUrl || errorVerificar) && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-sm text-sgl-gray-mid">Código OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpInput}
                    onChange={e => { setOtpInput(e.target.value.replace(/\D/g, "")); setErrorVerificar(""); }}
                    onKeyDown={e => { if (e.key === "Enter" && otpInput.length === 6) doVerificar(otpInput); }}
                    placeholder="000000"
                    autoFocus={!otpFromUrl}
                    className="bg-sgl-gray border border-sgl-gold/20 rounded-xl px-5 py-4 font-sans text-3xl text-center text-sgl-white placeholder:text-sgl-gray-mid/20 focus:outline-none focus:border-sgl-gold/60 transition-colors duration-200"
                    style={{ letterSpacing: "0.5em" }}
                  />
                </div>

                {errorVerificar && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 font-sans text-sm">
                    {errorVerificar}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => doVerificar(otpInput)}
                  disabled={otpInput.length !== 6 || verificando}
                  style={{
                    padding: "14px 40px",
                    opacity: otpInput.length === 6 && !verificando ? 1 : 0.4,
                    cursor:  otpInput.length === 6 && !verificando ? "pointer" : "not-allowed",
                  }}
                  className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200 inline-flex items-center justify-center gap-2"
                >
                  {verificando && (
                    <span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin" />
                  )}
                  {verificando ? "Verificando…" : "Verificar código"}
                </button>

                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => goTo("solicitar", "back")}
                    className="font-sans text-xs text-sgl-gray-mid/60 hover:text-sgl-gold transition-colors duration-200"
                  >
                    ← Solicitar un nuevo código
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ PASO: opciones ═══════════════════════════════════ */}
        {paso === "opciones" && cita && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="font-serif text-2xl font-semibold text-sgl-white">
                ¿Qué deseas hacer?
              </h2>
              <p className="font-sans text-sm text-sgl-gray-mid leading-relaxed">
                Identidad verificada. Elige una acción para tu cita.
              </p>
            </div>

            {/* Resumen de la cita actual */}
            <div className="relative rounded-xl border border-sgl-gold/30 bg-sgl-gray overflow-hidden">
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,var(--color-sgl-gold),transparent)" }} />
              <div className="p-5 flex flex-col gap-3">
                <p className="font-sans text-xs text-sgl-gold uppercase tracking-widest">Cita actual</p>
                <div className="flex flex-col gap-2">
                  <Fila label="Servicio" value={cita.materia} />
                  <Fila label="Fecha"    value={formatFecha(cita.fecha)} />
                  <Fila label="Hora"     value={formatHora(cita.hora)} />
                  <Fila label="Monto"    value={formatMonto(Number(cita.monto))} accent />
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => goTo("fecha-hora", "forward")}
                className="w-full flex items-center gap-4 rounded-xl border border-sgl-gold/30 bg-sgl-gray p-5 text-left hover:border-sgl-gold/60 hover:bg-sgl-gold/5 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-sgl-gold/10 flex items-center justify-center shrink-0 group-hover:bg-sgl-gold/20 transition-colors duration-200">
                  <svg className="w-5 h-5 text-sgl-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-sans text-sm font-semibold text-sgl-white">Reagendar cita</p>
                  <p className="font-sans text-xs text-sgl-gray-mid mt-0.5">Elige una nueva fecha y hora disponible</p>
                </div>
                <svg className="w-4 h-4 text-sgl-gold/50 group-hover:text-sgl-gold transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              <div className="flex items-start gap-3 bg-sgl-gray border border-sgl-gray-light/10 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-sgl-gold shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                </svg>
                <p className="font-sans text-xs text-sgl-gray-mid leading-relaxed">
                  <span className="text-sgl-white font-medium">Política:</span>{" "}
                  el reagendamiento requiere al menos 24 horas de anticipación respecto a tu cita actual.
                  Sujeto a disponibilidad de horarios.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ PASO: fecha-hora ═════════════════════════════════ */}
        {paso === "fecha-hora" && cita && (
          <PasoFechaHora
            servicio={{ id: cita.servicioId, nombre: cita.materia, precio: Number(cita.monto) }}
            onContinuar={sel => { setNuevaFechaHora(sel); goTo("resumen", "forward"); }}
            onAtras={() => goTo("opciones", "back")}
          />
        )}

        {/* ══ PASO: resumen ════════════════════════════════════ */}
        {paso === "resumen" && cita && nuevaFechaHora && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="font-serif text-2xl font-semibold text-sgl-white">
                Confirmar reagendamiento
              </h2>
              <p className="font-sans text-sm text-sgl-gray-mid leading-relaxed">
                Revisa el cambio antes de confirmar.
              </p>
            </div>

            {/* Comparación antes → después */}
            <div className="flex flex-col gap-2">
              <CardCita cita={cita} label="Cita actual" muted />

              <div className="flex items-center justify-center py-1">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-px h-4 bg-sgl-gold/30" />
                  <svg className="w-4 h-4 text-sgl-gold/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                </div>
              </div>

              <CardCita
                cita={{ ...cita, fecha: nuevaFechaHora.fecha, hora: nuevaFechaHora.hora }}
                label="Nueva fecha"
              />
            </div>

            {errorEnvio && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 font-sans text-sm">
                {errorEnvio}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => goTo("fecha-hora", "back")}
                disabled={enviando}
                style={{ padding: "12px 32px", opacity: enviando ? 0.4 : 1, cursor: enviando ? "not-allowed" : "pointer" }}
                className="border border-sgl-gold/40 text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10 font-semibold rounded transition-colors duration-200"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={doReagendar}
                disabled={enviando}
                style={{
                  padding: "12px 40px",
                  opacity: enviando ? 0.4 : 1,
                  cursor:  enviando ? "not-allowed" : "pointer",
                }}
                className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200 inline-flex items-center gap-2"
              >
                {enviando && <span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin" />}
                {enviando ? "Reagendando…" : "Confirmar cambio"}
              </button>
            </div>
          </div>
        )}

        {/* ══ PASO: exito ══════════════════════════════════════ */}
        {paso === "exito" && cita && nuevaFechaHora && (
          <div className="flex flex-col items-center gap-8 py-6 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)", border: "1px solid rgba(201,168,76,0.3)" }}
            >
              <svg className="w-10 h-10 text-sgl-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l3 3 5-5"/>
              </svg>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="font-serif text-3xl font-semibold text-sgl-white">¡Cita reagendada!</h2>
              <p className="font-sans text-base text-sgl-gray-mid leading-relaxed max-w-xs mx-auto">
                Tu cita ha sido reagendada exitosamente. Te enviaremos una confirmación por correo.
              </p>
            </div>

            <div className="relative rounded-xl border border-sgl-gold/40 bg-sgl-gray overflow-hidden w-full max-w-sm">
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,var(--color-sgl-gold),transparent)" }} />
              <div className="p-6 flex flex-col gap-3">
                <p className="font-sans text-xs text-sgl-gold uppercase tracking-widest">Nueva cita</p>
                <div className="flex flex-col gap-2">
                  <Fila label="Servicio" value={cita.materia} />
                  <Fila label="Fecha"    value={formatFecha(nuevaFechaHora.fecha)} />
                  <Fila label="Hora"     value={nuevaFechaHora.hora} accent />
                  <Fila label="ID"       value={cita.idExterno} />
                </div>
              </div>
            </div>

            <a
              href={`/confirmacion?id=${cita.idExterno}`}
              className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold px-8 py-3 rounded transition-colors duration-200"
            >
              Ver detalle de mi cita
            </a>
          </div>
        )}

      </StepTransition>
    </div>
  );
}
