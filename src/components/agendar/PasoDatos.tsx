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

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}

function Field({ id, label, type = "text", placeholder, value, onChange, autoComplete }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
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
        autoComplete={autoComplete}
        className="bg-sgl-black border border-sgl-gold/40 rounded-lg px-4 py-3 font-sans text-sm text-sgl-white placeholder:text-sgl-gray-mid/60 focus:outline-none focus:border-sgl-gold transition-colors duration-200"
      />
    </div>
  );
}

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(precio);
}

export default function PasoDatos({ servicio, inicial, onContinuar, onAtras }: Props) {
  const [nombre,   setNombre]   = useState(inicial?.nombre   ?? "");
  const [email,    setEmail]    = useState(inicial?.email    ?? "");
  const [telefono, setTelefono] = useState(inicial?.telefono ?? "");

  const puedesContinuar = nombre.trim() !== "" && email.trim() !== "" && telefono.trim() !== "";

  function handleContinuar() {
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
      <div className="flex flex-col gap-5 max-w-lg">
        <Field
          id="nombre"
          label="Nombre completo"
          placeholder="Ej: Juan Pérez González"
          value={nombre}
          onChange={setNombre}
          autoComplete="name"
        />
        <Field
          id="email"
          label="Correo electrónico"
          type="email"
          placeholder="correo@ejemplo.cl"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          id="telefono"
          label="Teléfono"
          type="tel"
          placeholder="+56 9 1234 5678"
          value={telefono}
          onChange={setTelefono}
          autoComplete="tel"
        />
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between gap-4 max-w-lg">
        <button
          type="button"
          onClick={onAtras}
          className="border border-sgl-gold/40 text-sgl-gold hover:border-sgl-gold hover:bg-sgl-gold/10 font-semibold rounded transition-colors duration-200"
          style={{ padding: "12px 32px" }}
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleContinuar}
          style={{
            padding: "12px 40px",
            opacity: puedesContinuar ? 1 : 0.4,
            cursor: puedesContinuar ? "pointer" : "not-allowed",
          }}
          className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold rounded transition-colors duration-200"
        >
          Continuar
        </button>
      </div>

    </div>
  );
}
