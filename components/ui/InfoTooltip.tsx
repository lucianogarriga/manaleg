"use client";

import { Info } from "lucide-react";
import { useRef, useState } from "react";

export default function InfoTooltip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLButtonElement>(null);

  const show = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const tooltipW = 220;
    // Open rightward from the icon, clamped to viewport
    const left = Math.max(8, Math.min(r.left, window.innerWidth - tooltipW - 8));
    setPos({ top: r.bottom + 7, left });
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="Más información"
        className="flex cursor-default items-center text-muted/60 transition-colors hover:text-sub"
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onClick={() => (pos ? setPos(null) : show())}
      >
        <Info size={12} />
      </button>

      {pos && (
        <div
          className="pointer-events-none w-[220px] rounded-lg border border-border bg-card p-[10px] text-[12px] font-normal normal-case leading-relaxed tracking-normal text-sub shadow-xl"
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 999 }}
        >
          {text}
        </div>
      )}
    </>
  );
}
