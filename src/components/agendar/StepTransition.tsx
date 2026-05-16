import { useState, useEffect, useRef } from "react";

interface Props {
  stepKey: number;
  direction: "forward" | "back";
  children: React.ReactNode;
}

const EXIT_MS  = 160;
const FRAME_MS = 16; // un frame — permite que el browser aplique el estado inicial antes de animar

/**
 * Envuelve el contenido de un paso/pantalla y aplica una transición
 * de fade + desplazamiento vertical al cambiar entre pasos.
 *
 * Uso:
 *   <StepTransition stepKey={paso} direction={direction}>
 *     {renderizarPasoActual()}
 *   </StepTransition>
 *
 * Para ajustar velocidad o easing, modificar las clases
 * .step-exit-*, .step-enter-*, .step-visible en global.css.
 */
export default function StepTransition({ stepKey, direction, children }: Props) {
  const [shown, setShown] = useState<React.ReactNode>(children);
  const [cls,   setCls]   = useState("step-visible");
  const prevKey = useRef(stepKey);
  const pending = useRef<{ children: React.ReactNode; direction: string } | null>(null);

  useEffect(() => {
    if (stepKey === prevKey.current) return;

    pending.current = { children, direction };
    prevKey.current = stepKey;

    // 1. Salida
    setCls(`step-exit-${direction}`);

    const exitTimer = setTimeout(() => {
      const p = pending.current;
      if (!p) return;

      // 2. Estado inicial de entrada (sin transición)
      setShown(p.children);
      setCls(`step-enter-${p.direction}`);

      // 3. Un frame después: animar a visible
      const enterTimer = setTimeout(() => setCls("step-visible"), FRAME_MS);
      return () => clearTimeout(enterTimer);
    }, EXIT_MS);

    return () => clearTimeout(exitTimer);
  }, [stepKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className={cls}>{shown}</div>;
}
