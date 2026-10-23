"use client";

import { useEffect, useRef } from "react";

// Fondo de la vista: manchas de color muy desenfocadas que se desplazan suave siguiendo el cursor.
// Solo mueve variables CSS (--mx / --my); las transiciones de cada mancha hacen el suavizado.
export default function FondoVivo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sinMovimiento =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off";
    if (sinMovimiento) return;

    let frame = 0;
    let x = 0.5;
    let y = 0.5;
    const aplicar = () => {
      frame = 0;
      el.style.setProperty("--mx", x.toFixed(3));
      el.style.setProperty("--my", y.toFixed(3));
    };
    const alMover = (e: PointerEvent) => {
      x = e.clientX / window.innerWidth;
      y = e.clientY / window.innerHeight;
      if (!frame) frame = requestAnimationFrame(aplicar);
    };
    window.addEventListener("pointermove", alMover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", alMover);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="fondo-vivo pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="fondo-blob b1" />
      <span className="fondo-blob b2" />
    </div>
  );
}
