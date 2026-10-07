"use client";

import { useEffect, useState } from "react";

// Muestra un ring pulsante sobre el FAB (fixed bottom-5 right-5) durante 4 segundos
// cuando localStorage["manaleg_fab_spotlight"] === "1".
export default function FabSpotlight() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("manaleg_fab_spotlight") === "1") {
        localStorage.removeItem("manaleg_fab_spotlight");
        setShow(true);
        const t = setTimeout(() => setShow(false), 4000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes fab-ping {
          0%   { transform: scale(1);   opacity: .7; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .fab-ping { animation: fab-ping 1.2s ease-out infinite; }
      `}</style>
      {/* Ring exterior */}
      <span
        aria-hidden="true"
        className="fab-ping pointer-events-none fixed bottom-5 right-5 z-[19] block h-[42px] w-[42px] rounded-full"
        style={{ background: "var(--color-blue)", opacity: .5 }}
      />
      {/* Tooltip "Empezá acá" */}
      <span
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[58px] right-[52px] z-[19] whitespace-nowrap rounded-[6px] px-[8px] py-[4px] text-[12px] font-semibold text-white shadow-lg"
        style={{ background: "var(--color-blue)" }}
      >
        Empezá acá ↓
      </span>
    </>
  );
}
