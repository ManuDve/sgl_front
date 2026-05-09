import type { DatosCliente } from "./PasoDatos";
import type { FechaHoraSeleccion } from "./PasoFechaHora";

// ─── Types ───────────────────────────────────────────────────

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

interface Props {
  servicio: Servicio;
  datos: DatosCliente;
  fechaHora: FechaHoraSeleccion;
  onConfirmar: () => void;
  onAtras: () => void;
  enviando?: boolean;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

const MESES_LARGO = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DIAS_LARGO = [
  "Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado",
];

function formatFecha(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DIAS_LARGO[dow]} ${d} de ${MESES_LARGO[m - 1]} de ${y}`;
}

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(precio);
}

// ─── Sub-componentes ──────────────────────────────────────────

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-sans text-xs text-sgl-gold uppercase tracking-widest">{titulo}</p>
      {children}
    </div>
  );
}

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-sans text-sm text-sgl-gray-mid shrink-0">{label}</span>
      <span className="font-sans text-sm text-sgl-white text-right">{value}</span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────

export default function PasoResumen({ servicio, datos, fechaHora, onConfirmar, onAtras, enviando = false, error = "" }: Props) {
  return (
    <div className="flex flex-col gap-10">

      {/* Título */}
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-sgl-white">
          Revisa tu agendamiento
        </h2>
        <p className="font-sans text-base text-sgl-gray-mid leading-relaxed">
          Verifica que todo esté correcto antes de confirmar.
        </p>
      </div>

      {/* Card resumen */}
      <div className="relative rounded-xl border border-sgl-gold/40 bg-sgl-gray overflow-hidden">

        {/* Línea accent superior */}
        <div className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, var(--color-sgl-gold), transparent)" }} />

        <div className="p-6 md:p-8 flex flex-col gap-6">

          {/* Servicio */}
          <Seccion titulo="Servicio">
            <Fila label="Materia"      value={servicio.nombre} />
            {servicio.descripcion && (
              <Fila label="Descripción" value={servicio.descripcion} />
            )}
          </Seccion>

          <div className="border-t border-sgl-gold/10" />

          {/* Fecha y hora */}
          <Seccion titulo="Fecha y hora">
            <Fila label="Fecha" value={formatFecha(fechaHora.fecha)} />
            <Fila label="Hora"  value={fechaHora.hora} />
          </Seccion>

          <div className="border-t border-sgl-gold/10" />

          {/* Datos del cliente */}
          <Seccion titulo="Tus datos">
            <Fila label="Nombre"   value={datos.nombre} />
            <Fila label="Correo"   value={datos.email} />
            <Fila label="Teléfono" value={datos.telefono} />
          </Seccion>

          <div className="border-t border-sgl-gold/20" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm font-semibold text-sgl-white">Total a pagar</span>
            <span className="font-serif text-2xl font-bold text-sgl-gold">
              {formatPrecio(servicio.precio)}
            </span>
          </div>

        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 font-sans text-sm">
          {error}
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onAtras}
          disabled={enviando}
          style={{ padding: "12px 32px", opacity: enviando ? 0.4 : 1 }}
          className="border border-sgl-gold/40 text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10 font-semibold rounded transition-colors duration-200"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={enviando}
          style={{ padding: "12px 40px", opacity: enviando ? 0.7 : 1, cursor: enviando ? "not-allowed" : "pointer" }}
          className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200 inline-flex items-center gap-2"
        >
          {enviando && (
            <span className="w-4 h-4 border-2 border-sgl-black/30 border-t-sgl-black rounded-full animate-spin" />
          )}
          {enviando ? "Enviando…" : "Confirmar agendamiento"}
        </button>
      </div>

    </div>
  );
}
