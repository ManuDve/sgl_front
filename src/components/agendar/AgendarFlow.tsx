import { useState } from "react";
import Stepper from "./Stepper";
import PasoServicio from "./PasoServicio";
import PasoDatos, { type DatosCliente } from "./PasoDatos";
import PasoFechaHora, { type FechaHoraSeleccion } from "./PasoFechaHora";
import PasoResumen from "./PasoResumen";
import StepTransition from "../StepTransition";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

type Paso = 1 | 2 | 3 | 4;
type Direccion = "forward" | "back";

export default function AgendarFlow() {
  const [paso,       setPaso]       = useState<Paso>(1);
  const [direccion,  setDireccion]  = useState<Direccion>("forward");
  const [servicio,   setServicio]   = useState<Servicio | null>(null);
  const [datos,      setDatos]      = useState<DatosCliente | null>(null);
  const [fechaHora,  setFechaHora]  = useState<FechaHoraSeleccion | null>(null);
  const [enviando,   setEnviando]   = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  function goTo(nuevoPaso: Paso, dir: Direccion) {
    setDireccion(dir);
    setPaso(nuevoPaso);
  }

  function handleServicioContinuar(s: Servicio) {
    setServicio(s);
    goTo(2, "forward");
  }

  function handleDatosContinuar(d: DatosCliente) {
    setDatos(d);
    goTo(3, "forward");
  }

  function handleFechaHoraContinuar(fh: FechaHoraSeleccion) {
    setFechaHora(fh);
    goTo(4, "forward");
  }

  async function handleConfirmar() {
    if (!servicio || !datos || !fechaHora) return;
    setEnviando(true);
    setErrorEnvio("");

    try {
      const res = await fetch("http://localhost:8080/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCliente:  datos.nombre,
          email:          datos.email,
          telefono:       datos.telefono,
          serviceId:      servicio.id,
          fecha:          fechaHora.fecha,
          hora:           fechaHora.hora + ":00",
          aceptaTerminos: true,
        }),
      });

      const body = await res.json();

      if (res.status === 201) {
        window.location.href = `/confirmacion?id=${body.data.idExterno}`;
      } else {
        setErrorEnvio(body.message ?? "Error al crear el agendamiento. Intenta nuevamente.");
      }
    } catch {
      setErrorEnvio("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <Stepper pasoActual={paso} />

      <StepTransition key={paso} direction={direccion}>
        {paso === 1 && (
          <PasoServicio onContinuar={handleServicioContinuar} />
        )}

        {paso === 2 && servicio && (
          <PasoDatos
            servicio={servicio}
            inicial={datos ?? undefined}
            onContinuar={handleDatosContinuar}
            onAtras={() => goTo(1, "back")}
          />
        )}

        {paso === 3 && servicio && (
          <PasoFechaHora
            servicio={servicio}
            inicial={fechaHora ?? undefined}
            onContinuar={handleFechaHoraContinuar}
            onAtras={() => goTo(2, "back")}
          />
        )}

        {paso === 4 && servicio && datos && fechaHora && (
          <PasoResumen
            servicio={servicio}
            datos={datos}
            fechaHora={fechaHora}
            onConfirmar={handleConfirmar}
            onAtras={() => goTo(3, "back")}
            enviando={enviando}
            error={errorEnvio}
          />
        )}
      </StepTransition>
    </div>
  );
}
