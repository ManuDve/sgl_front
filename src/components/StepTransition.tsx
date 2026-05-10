/**
 * StepTransition — wrapper de transición entre pasos o pantallas.
 *
 * Uso:
 *   <StepTransition key={paso} direction={direction}>
 *     {contenido del paso}
 *   </StepTransition>
 *
 * El `key` externo es lo que dispara la animación: cuando cambia,
 * React desmonta el componente viejo y monta este con la animación CSS.
 *
 * Props:
 *   direction  "forward" (default) | "back"
 *              El contenido entra desde abajo en "forward", desde arriba en "back".
 *
 * Keyframes requeridos en global.css:
 *   step-enter-forward, step-enter-back
 *
 * Para usar en una pantalla nueva:
 *   1. Importar StepTransition.
 *   2. Mantener un estado `direction: "forward" | "back"`.
 *   3. Actualizar `direction` ANTES de cambiar el `key`.
 *   4. Envolver el contenido:
 *        <StepTransition key={paso} direction={direction}>
 *          ...
 *        </StepTransition>
 */

interface Props {
  direction?: "forward" | "back";
  children: React.ReactNode;
}

export default function StepTransition({ direction = "forward", children }: Props) {
  return (
    <div
      style={{
        animation: `${
          direction === "forward" ? "step-enter-forward" : "step-enter-back"
        } 280ms cubic-bezier(0.16, 1, 0.3, 1) both`,
      }}
    >
      {children}
    </div>
  );
}
