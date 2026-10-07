"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (v: boolean) => void;
}

export function useConfirm() {
  const [pending, setPending] = useState<ConfirmRequest | null>(null);

  const request = (opts: Omit<ConfirmRequest, "resolve">) =>
    new Promise<boolean>((resolve) => setPending({ ...opts, resolve }));

  const dialog = pending ? (
    <ConfirmDialog
      title={pending.title}
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      danger={pending.danger}
      onConfirm={() => { pending.resolve(true); setPending(null); }}
      onCancel={() => { pending.resolve(false); setPending(null); }}
    />
  ) : null;

  return { request, dialog };
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div
          className="w-full max-w-[360px] rounded-xl bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-4">
            <div
              className={`mt-[1px] flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                danger ? "bg-red/10" : "bg-amb-lt"
              }`}
            >
              {danger ? (
                <Trash2 size={16} className="text-red" />
              ) : (
                <AlertTriangle size={16} className="text-amb" />
              )}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-text">{title}</h3>
              <p className="mt-1 text-[13px] leading-[1.5] text-sub">{message}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-[7px] border border-border px-3 py-[6px] text-[13px] font-medium text-sub transition-colors hover:bg-bg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`cursor-pointer rounded-[7px] px-3 py-[6px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 ${
                danger ? "bg-red" : "bg-blue"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
