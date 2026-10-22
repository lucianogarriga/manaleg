"use client";

import { useEffect, useRef } from "react";

// Cuenta desde el valor anterior (0 al montar) hasta `value`, con desaceleración suave.
// Escribe el texto directo en el DOM (sin setState por frame) para no re-renderizar React en cada paso.
export default function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString("es-AR"),
  duration = 1100,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const actual = useRef(0);
  // La función de formato puede cambiar en cada render: se lee la última sin reiniciar la animación
  const formatRef = useRef(format);
  formatRef.current = format;

  const pintar = (v: number) => {
    const el = ref.current;
    if (!el) return;
    const texto = formatRef.current(v);
    // Cambiar nodeValue no genera mutaciones de hijos (el observador de DominoReveal no se entera)
    if (el.firstChild) el.firstChild.nodeValue = texto;
    else el.textContent = texto;
  };

  useEffect(() => {
    const sinMovimiento =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off";
    if (!Number.isFinite(value) || sinMovimiento) {
      actual.current = value;
      pintar(value);
      return;
    }
    const desde = actual.current;
    const inicio = performance.now();
    let raf = 0;
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / duration);
      const e = 1 - Math.pow(1 - p, 4);
      const v = desde + (value - desde) * e;
      actual.current = v;
      pintar(v);
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span ref={ref}>{format(0)}</span>;
}
