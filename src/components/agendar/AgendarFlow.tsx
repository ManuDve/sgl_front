import { useState } from "react";
import Stepper from "./Stepper";
import PasoServicio from "./PasoServicio";
import PasoDatos, { type DatosCliente } from "./PasoDatos";
import PasoFechaHora, { type FechaHoraSeleccion } from "./PasoFechaHora";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

type Paso = 1 | 2 | 3 | 4;

export default function AgendarFlow() {
  const [paso,      setPaso]      = useState<Paso>(1);
  const [servicio,  setServicio]  = useState<Servicio | null>(null);
  const [datos,     setDatos]     = useState<DatosCliente | null>(null);
  const [fechaHora, setFechaHora] = useState<FechaHoraSeleccion | null>(null);

  function handleServicioContinuar(s: Servicio) {
    setServicio(s);
    setPaso(2);
  }

  function handleDatosContinuar(d: DatosCliente) {
    setDatos(d);
    setPaso(3);
  }

  function handleFechaHoraContinuar(fh: FechaHoraSeleccion) {
    setFechaHora(fh);
    // setPaso(4) — se activa al implementar SGL-023 AG-RESUMEN
  }

  return (
    <div className="flex flex-col gap-10">
      <Stepper pasoActual={paso} />

      {paso === 1 && (
        <PasoServicio onContinuar={handleServicioContinuar} />
      )}

      {paso === 2 && servicio && (
        <PasoDatos
          servicio={servicio}
          inicial={datos ?? undefined}
          onContinuar={handleDatosContinuar}
          onAtras={() => setPaso(1)}
        />
      )}

      {paso === 3 && servicio && (
        <PasoFechaHora
          servicio={servicio}
          inicial={fechaHora ?? undefined}
          onContinuar={handleFechaHoraContinuar}
          onAtras={() => setPaso(2)}
        />
      )}
    </div>
  );
}
