"use client";

import { ClipboardList, FileText, Gavel, Phone, Scale, Trash2, Wallet, type LucideIcon } from "lucide-react";
import { formatDateTime, getInitials } from "@/utils/formatters";
import type { MovimientoConAutor, TipoMovimiento } from "@/types";

const TIPO_ICON: Record<TipoMovimiento, LucideIcon> = {
  Presentación: FileText,
  Llamada: Phone,
  Resolución: Scale,
  Audiencia: Gavel,
  Pago: Wallet,
  Otro: ClipboardList,
};

interface MovimientoTimelineProps {
  items: MovimientoConAutor[];
  userId: string;
  onDelete: (id: string) => void;
}

// Línea vertical con dots; el más reciente lleva borde azul.
export default function MovimientoTimeline({ items, userId, onDelete }: MovimientoTimelineProps) {
  return (
    <div className="px-[13px] pt-2 pb-[13px]">
      {items.map((m, i) => {
        const Icon = (m.tipo && TIPO_ICON[m.tipo]) || ClipboardList;
        const autor = m.autor?.nombre_completo ?? m.autor?.email ?? "—";
        return (
          <div key={m.id} className="group relative flex gap-[10px]">
            {i < items.length - 1 && (
              <span className="absolute top-[18px] -bottom-1 left-[9px] w-px bg-slate-200" />
            )}
            <span
              className={`mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                i === 0 ? "border-blue bg-blue-lt text-blue" : "border-border bg-bg text-muted"
              }`}
            >
              <Icon size={9} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] leading-[1.4] break-words whitespace-pre-line text-text">
                {m.descripcion}
              </div>
              <div className="mb-2 flex items-center gap-1 text-[12px] text-muted">
                <span>
                  {formatDateTime(m.fecha)} ·{" "}
                  <span title={autor}>{getInitials(m.autor?.nombre_completo, autor[0]?.toUpperCase())}</span>
                  {m.tipo && ` · ${m.tipo}`}
                </span>
                {m.autor_id === userId && (
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    aria-label="Eliminar movimiento"
                    className="ml-1 flex cursor-pointer text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red focus:opacity-100"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
