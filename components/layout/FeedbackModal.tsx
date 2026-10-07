"use client";

import { useRef, useState, useTransition } from "react";
import { X, MessageSquare, Send } from "lucide-react";
import { enviarFeedback } from "@/app/(app)/ajustes/actions";

interface Props {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: Props) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    startTransition(async () => {
      const r = await enviarFeedback(texto);
      if (r.error) {
        setResultado({ ok: false, msg: r.error });
      } else {
        setResultado({ ok: true, msg: "¡Gracias! Tu feedback fue enviado." });
        setTexto("");
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <div
          ref={ref}
          className="w-full max-w-[400px] overflow-hidden rounded-xl border shadow-2xl"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-blue" />
              <span className="text-[14px] font-semibold text-text">Enviar feedback</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg p-[4px] text-sub transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {resultado?.ok ? (
              <div className="py-6 text-center">
                <p className="text-[15px] font-semibold text-text">¡Gracias por tu feedback!</p>
                <p className="mt-1 text-[13px] text-muted">Lo revisaremos a la brevedad.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 cursor-pointer rounded-[7px] bg-blue px-5 py-[7px] text-[13px] font-semibold text-white hover:opacity-90"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-[13px] text-muted">
                  Contanos qué mejorarías, qué funciona bien o qué te gustaría tener en MANALEG.
                </p>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Tu mensaje..."
                  maxLength={1000}
                  rows={5}
                  className="w-full resize-none rounded-[8px] border px-3 py-2 text-[13px] text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue/30"
                  style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                />
                <div className="mb-3 text-right text-[11px] text-muted">{texto.length}/1000</div>

                {resultado?.msg && !resultado.ok && (
                  <p className="mb-2 text-[12px] text-red">{resultado.msg}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || !texto.trim()}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-blue py-[9px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={13} />
                  {isPending ? "Enviando..." : "Enviar feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
