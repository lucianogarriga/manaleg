"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

const DURATION_MS = 10000;

// Aviso temporal (confirmaciones de crear/editar/eliminar). Se monta una vez en AppLayout.
export default function Toaster() {
  const toast = useUIStore((s) => s.toast);
  const dismiss = useUIStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded-[10px] px-6 py-4 text-[14px] shadow-xl"
      style={{ background: "#1e293b", color: "#f1f5f9" }}
    >
      <CheckCircle2 size={22} className="shrink-0 text-[#34D399]" />
      <span>{toast.message}</span>
      {toast.actionLabel && (
        <button
          type="button"
          onClick={() => {
            dismiss();
            toast.onAction?.();
          }}
          className="cursor-pointer rounded-[6px] bg-white/15 px-3 py-[6px] text-[13px] font-semibold whitespace-nowrap hover:bg-white/25"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar aviso"
        className="flex cursor-pointer text-white/50 hover:text-white"
      >
        <X size={17} />
      </button>
    </div>
  );
}
