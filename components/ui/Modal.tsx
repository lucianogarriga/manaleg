"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ancho?: "md" | "xl"; // md: 640px (por defecto), xl: 960px para tablas
}

export default function Modal({ open, title, onClose, children, footer, ancho = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col ${ancho === "xl" ? "max-w-[960px]" : "max-w-[640px]"} overflow-hidden rounded-t-[10px] border border-border bg-card shadow-xl sm:rounded-[9px]`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-[16px] font-bold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex cursor-pointer rounded p-1 text-muted hover:bg-bg hover:text-sub"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-border bg-bg/60 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
