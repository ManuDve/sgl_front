import { useState } from "react";
import Stepper from "./Stepper";
import StepTransition from "./StepTransition";
import PasoServicio from "./PasoServicio";
import PasoDatos, { type DatosCliente } from "./PasoDatos";
import PasoFechaHora, { type FechaHoraSeleccion } from "./PasoFechaHora";
import PasoResumen from "./PasoResumen";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

type Paso = 1 | 2 | 3 | 4;

export default function AgendarFlow() {
  const [paso,      setPaso]      = useState<Paso>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [servicio,  setServicio]  = useState<Servicio | null>(null);
  const [datos,     setDatos]     = useState<DatosCliente | null>(null);
  const [fechaHora, setFechaHora] = useState<FechaHoraSeleccion | null>(null);
  const [enviando,  setEnviando]  = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  function avanzar(newPaso: Paso) { setDirection("forward"); setPaso(newPaso); }
  function retroceder(newPaso: Paso) { setDirection("back"); setPaso(newPaso); }

  function handleServicioContinuar(s: Servicio) { setServicio(s); avanzar(2); }
  function handleDatosContinuar(d: DatosCliente) { setDatos(d); avanzar(3); }
  function handleFechaHoraContinuar(fh: FechaHoraSeleccion) { setFechaHora(fh); avanzar(4); }

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

      <StepTransition stepKey={paso} direction={direction}>
        {paso === 1 ? (
          <PasoServicio onContinuar={handleServicioContinuar} />
        ) : paso === 2 && servicio ? (
          <PasoDatos
            servicio={servicio}
            inicial={datos ?? undefined}
            onContinuar={handleDatosContinuar}
            onAtras={() => retroceder(1)}
          />
        ) : paso === 3 && servicio ? (
          <PasoFechaHora
            servicio={servicio}
            inicial={fechaHora ?? undefined}
            onContinuar={handleFechaHoraContinuar}
            onAtras={() => retroceder(2)}
          />
        ) : paso === 4 && servicio && datos && fechaHora ? (
          <PasoResumen
            servicio={servicio}
            datos={datos}
            fechaHora={fechaHora}
            onConfirmar={handleConfirmar}
            onAtras={() => retroceder(3)}
            enviando={enviando}
            error={errorEnvio}
          />
        ) : null}
      </StepTransition>
    </div>
  );
}
