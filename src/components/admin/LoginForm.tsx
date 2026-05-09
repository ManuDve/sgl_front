import { useState } from "react";

interface FormState {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginForm() {
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!form.email.trim()) errors.email = "El email es obligatorio";
    if (!form.password.trim()) errors.password = "La contraseña es obligatoria";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("sgl_token", data.data.token);
        window.location.href = "/admin/dashboard";
      } else if (res.status === 401) {
        setServerError("Credenciales incorrectas");
      } else {
        setServerError("Error del servidor. Intenta nuevamente.");
      }
    } catch {
      setServerError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-sgl-gray rounded-lg p-10 w-full max-w-md flex flex-col gap-8"
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-serif text-2xl font-bold text-sgl-white">
          SGL<span className="text-sgl-gold">.</span>
        </h1>
        <p className="font-sans text-sm text-sgl-gray-mid">Panel administrativo</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-sans text-sm text-sgl-gray-mid">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            className={`bg-sgl-black border rounded px-4 py-2.5 font-sans text-sm text-sgl-white placeholder:text-sgl-gray-mid focus:outline-none focus:border-sgl-gold transition-colors duration-200 disabled:opacity-50 ${
              fieldErrors.email ? "border-red-500" : "border-sgl-gold/40"
            }`}
            placeholder="admin@estudio.cl"
          />
          {fieldErrors.email && (
            <span className="font-sans text-xs text-red-400">{fieldErrors.email}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-sans text-sm text-sgl-gray-mid">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            className={`bg-sgl-black border rounded px-4 py-2.5 font-sans text-sm text-sgl-white placeholder:text-sgl-gray-mid focus:outline-none focus:border-sgl-gold transition-colors duration-200 disabled:opacity-50 ${
              fieldErrors.password ? "border-red-500" : "border-sgl-gold/40"
            }`}
            placeholder="••••••••"
          />
          {fieldErrors.password && (
            <span className="font-sans text-xs text-red-400">{fieldErrors.password}</span>
          )}
        </div>
      </div>

      {serverError && (
        <p className="font-sans text-sm text-red-400 text-center">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-sgl-gold hover:bg-sgl-gold-light text-sgl-black font-semibold px-6 py-3 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
