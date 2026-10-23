// Fondo fijo de la vista: manchas de color muy desenfocadas, sin movimiento.
export default function FondoVivo() {
  return (
    <div aria-hidden className="fondo-vivo pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="fondo-blob b1" />
      <span className="fondo-blob b2" />
    </div>
  );
}
