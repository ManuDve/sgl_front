import { useState } from "react";
import Stepper from "./Stepper";
import PasoServicio from "./PasoServicio";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

type Paso = 1 | 2 | 3 | 4;

export default function AgendarFlow() {
  const [paso, setPaso] = useState<Paso>(1);
  const [servicio, setServicio] = useState<Servicio | null>(null);

  function handleServicioContinuar(s: Servicio) {
    setServicio(s);
    // setPaso(2) — se activa al implementar SGL-017 AG-DATOS
  }

  return (
    <div className="flex flex-col gap-10">
      <Stepper pasoActual={paso} />

      <div>
        {paso === 1 && (
          <PasoServicio onContinuar={handleServicioContinuar} />
        )}
      </div>
    </div>
  );
}
