"use client";

import { Mail, X } from "lucide-react";

export default function ContactModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <div
          className="w-full max-w-[380px] overflow-hidden rounded-xl border shadow-2xl"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-[14px] font-semibold text-text">Contactanos</span>
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-[4px] text-sub transition-colors hover:bg-border">
              <X size={15} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-[13px] text-muted leading-[1.6]">
              Estamos para ayudarte. Escribinos y te respondemos a la brevedad.
            </p>
            <a
              href="mailto:contacto@manaleg.com.ar"
              className="flex items-center gap-3 rounded-[8px] border px-4 py-3 text-[13px] font-medium text-text transition-colors hover:bg-bg"
              style={{ borderColor: "var(--color-border)" }}
            >
              <Mail size={15} className="shrink-0 text-blue" />
              contacto@manaleg.com.ar
            </a>
            <p className="text-[11.5px] text-muted">Lunes a Viernes, 9 a 18 hs (Argentina)</p>
          </div>
        </div>
      </div>
    </>
  );
}
