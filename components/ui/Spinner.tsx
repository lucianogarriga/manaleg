"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 900;

export default function Spinner({ label = "Cargando..." }: { label?: string }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.round((((now - start) % DURATION_MS) / DURATION_MS) * 100);
      if (fillRef.current) fillRef.current.style.width = `${pct}%`;
      if (pctRef.current) pctRef.current.textContent = `${pct}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex w-[min(260px,70vw)] flex-col items-center py-12" role="status" aria-label={label}>
      <div
        className="relative flex h-[24px] w-full items-center justify-between overflow-hidden rounded-full px-[12px] text-[11.5px] font-semibold text-text"
        style={{ background: "color-mix(in srgb, var(--sb-accent) 18%, transparent)" }}
      >
        <div
          ref={fillRef}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: "0%", background: "var(--sb-accent)" }}
        />
        <span className="relative">{label}</span>
        <span ref={pctRef} className="relative tabular-nums">0%</span>
      </div>
    </div>
  );
}
