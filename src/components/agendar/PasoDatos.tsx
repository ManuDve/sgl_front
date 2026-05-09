import { useState } from "react";

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
}

export interface DatosCliente {
  nombre: string;
  email: string;
  telefono: string;
}

interface Props {
  servicio: Servicio;
  inicial?: DatosCliente;
  onContinuar: (datos: DatosCliente) => void;
  onAtras: () => void;
}

// ─── Validadores ─────────────────────────────────────────────

const VALIDATORS = {
  nombre: (v: string): string => {
    if (!v.trim()) return "El nombre es obligatorio.";
    // Mínimo 2 palabras, solo letras (con tildes) y espacios
    if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+([ ][a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+)+$/.test(v.trim()))
      return "Ingresa nombre y apellido (solo letras, sin números).";
    return "";
  },
  email: (v: string): string => {
    if (!v.trim()) return "El correo es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
      return "Ingresa un correo válido (ej: nombre@dominio.cl).";
    return "";
  },
  telefono: (v: string): string => {
    if (!v.trim()) return "El teléfono es obligatorio.";
    // Acepta: +56912345678 | +56 9 1234 5678 | +56 912345678
    if (!/^\+56\s?[0-9]\s?\d{4}\s?\d{4}$/.test(v.trim()))
      return "Usa el formato chileno: +56 9 1234 5678.";
    return "";
  },
} as const;

type Campo = keyof typeof VALIDATORS;

type Errores  = Record<Campo, string>;
type Touched  = Record<Campo, boolean>;

// ─── Componente de campo ──────────────────────────────────────

interface FieldProps {
  id: Campo;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  autoComplete?: string;
  error: string;
  touched: boolean;
}

function Field({ id, label, type = "text", placeholder, value, onChange, onBlur, autoComplete, error, touched }: FieldProps) {
  const hasError = touched && error !== "";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-sm text-sgl-gray-mid">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        className={`bg-sgl-black border rounded-lg px-4 py-3 font-sans text-sm text-sgl-white placeholder:text-sgl-gray-mid/60 focus:outline-none transition-colors duration-200 ${
          hasError
            ? "border-red-500 focus:border-red-400"
            : "border-sgl-gold/40 focus:border-sgl-gold"
        }`}
      />
      {hasError && (
        <p className="font-sans text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(precio);
}

function validate(nombre: string, email: string, telefono: string): Errores {
  return {
    nombre:   VALIDATORS.nombre(nombre),
    email:    VALIDATORS.email(email),
    telefono: VALIDATORS.telefono(telefono),
  };
}

// ─── Componente principal ─────────────────────────────────────

export default function PasoDatos({ servicio, inicial, onContinuar, onAtras }: Props) {
  const [nombre,   setNombre]   = useState(inicial?.nombre   ?? "");
  const [email,    setEmail]    = useState(inicial?.email    ?? "");
  const [telefono, setTelefono] = useState(inicial?.telefono ?? "");

  const [errors,  setErrors]  = useState<Errores>({ nombre: "", email: "", telefono: "" });
  const [touched, setTouched] = useState<Touched>({ nombre: false, email: false, telefono: false });

  const allValues = { nombre, email, telefono };

  // Validar al perder foco
  function handleBlur(campo: Campo) {
    setTouched(t => ({ ...t, [campo]: true }));
    setErrors(e => ({ ...e, [campo]: VALIDATORS[campo](allValues[campo]) }));
  }

  // Re-validar en tiempo real si el campo ya fue tocado
  function handleChange(campo: Campo, value: string, setter: (v: string) => void) {
    setter(value);
    if (touched[campo]) {
      setErrors(e => ({ ...e, [campo]: VALIDATORS[campo](value) }));
    }
  }

  // Verificar si todos los campos son válidos (sin necesidad de haber sido tocados)
  const currentErrors = validate(nombre, email, telefono);
  const isValid = Object.values(currentErrors).every(e => e === "");

  function handleContinuar() {
    // Mostrar todos los errores aunque el usuario no haya tocado los campos
    setTouched({ nombre: true, email: true, telefono: true });
    setErrors(currentErrors);
    if (!isValid) return;
    onContinuar({ nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() });
  }

  return (
    <div className="flex flex-col gap-10">

      {/* Título */}
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-sgl-white">
          Tus datos de contacto
        </h2>
        <p className="font-sans text-base text-sgl-gray-mid leading-relaxed">
          Necesitamos esta información para confirmar tu cita.
        </p>
      </div>

      {/* Resumen del servicio elegido */}
      <div className="flex items-center gap-3 bg-sgl-gray border border-sgl-gold/20 rounded-xl px-5 py-4">
        <span className="w-2 h-2 rounded-full bg-sgl-gold shrink-0" />
        <span className="font-sans text-sm text-sgl-white">{servicio.nombre}</span>
        <span className="ml-auto font-sans text-sm font-semibold text-sgl-gold">
          {formatPrecio(servicio.precio)}
        </span>
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-5">
        <Field
          id="nombre"
          label="Nombre completo"
          placeholder="Ej: Juan Pérez González"
          value={nombre}
          onChange={(v) => handleChange("nombre", v, setNombre)}
          onBlur={() => handleBlur("nombre")}
          autoComplete="name"
          error={errors.nombre}
          touched={touched.nombre}
        />
        <Field
          id="email"
          label="Correo electrónico"
          type="email"
          placeholder="correo@ejemplo.cl"
          value={email}
          onChange={(v) => handleChange("email", v, setEmail)}
          onBlur={() => handleBlur("email")}
          autoComplete="email"
          error={errors.email}
          touched={touched.email}
        />
        <Field
          id="telefono"
          label="Teléfono"
          type="tel"
          placeholder="+56 9 1234 5678"
          value={telefono}
          onChange={(v) => handleChange("telefono", v, setTelefono)}
          onBlur={() => handleBlur("telefono")}
          autoComplete="tel"
          error={errors.telefono}
          touched={touched.telefono}
        />
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onAtras}
          style={{ padding: "12px 32px" }}
          className="border border-sgl-gold/40 text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10 font-semibold rounded transition-colors duration-200"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleContinuar}
          style={{
            padding: "12px 40px",
            opacity: isValid ? 1 : 0.4,
            cursor:  isValid ? "pointer" : "not-allowed",
          }}
          className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200"
        >
          Continuar
        </button>
      </div>

    </div>
  );
}
