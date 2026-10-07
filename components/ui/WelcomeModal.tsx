"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { markWelcomeSeen } from "@/app/(app)/causas/welcomeAction";

export default function WelcomeModal() {
  const [open, setOpen] = useState(true);
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);
  const closeRef  = useRef<HTMLButtonElement>(null);

  // Entrada animada
  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open]);

  // Esc para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = async () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 200);
    localStorage.setItem("manaleg_fab_spotlight", "1");
    await markWelcomeSeen();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(2px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        style={{
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "transform 220ms ease",
        }}
      >
        {/* Close */}
        <button
          ref={closeRef}
          type="button"
          onClick={handleClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex cursor-pointer items-center justify-center rounded-full p-[5px] text-muted transition-colors hover:bg-bg hover:text-text"
        >
          <X size={15} />
        </button>

        {/* Logo + encabezado */}
        <div className="flex flex-col items-center px-6 pt-7 pb-3 text-center">
          <div
            className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] shadow-md"
            style={{ background: "var(--color-blue)" }}
          >
            <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 22V2L15 15L28 2V22"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 id="welcome-title" className="mb-[6px] text-[18px] font-bold text-text">
            Bienvenido a Manaleg
          </h2>
          <p className="text-[13.5px] leading-[1.6] text-sub">
            Sos uno de los primeros usuarios de la plataforma. Tu opinión importa — podés enviarnos feedback
            desde <span className="font-semibold text-text">Configuración de perfil</span> cuando quieras.
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center px-6 pb-7 pt-3">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-[7px] border border-blue bg-blue px-6 py-[8px] text-[13.5px] font-semibold text-white transition-all hover:bg-blue/90 active:scale-[.98]"
          >
            Cargar mi primera causa
          </button>
        </div>
      </div>
    </div>
  );
}
