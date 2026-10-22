"use client";

import { useEffect, useRef, useState } from "react";

// Cuenta desde el valor anterior (0 al montar) hasta `value`, con desaceleración suave.
export default function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString("es-AR"),
  duration = 1100,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);
  const actual = useRef(0);

  useEffect(() => {
    const sinMovimiento =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off";
    if (!Number.isFinite(value) || sinMovimiento) {
      actual.current = value;
      setShown(value);
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
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(shown)}</>;
}
