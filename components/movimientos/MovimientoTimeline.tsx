"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatDateTime, getInitials } from "@/utils/formatters";
import type { MovimientoConAutor } from "@/types";

interface MovimientoTimelineProps {
  items: MovimientoConAutor[];
  userId: string;
  onDelete: (id: string) => void;
  onEdit: (m: MovimientoConAutor) => void;
}

export default function MovimientoTimeline({ items, userId, onDelete, onEdit }: MovimientoTimelineProps) {
  return (
    <div className="px-[13px] pt-2 pb-[13px]">
      {items.map((m, i) => {
        const nombre = m.autor?.nombre_completo ?? null;
        const email = m.autor?.email ?? "?";
        const isOwner = m.autor_id === userId;
        return (
          <div key={m.id} className="group relative flex gap-[10px]">
            {i < items.length - 1 && (
              <span className="absolute top-[24px] -bottom-1 left-[10px] w-px bg-border" />
            )}
            <span
              className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-border bg-card text-[9px] font-semibold text-sub shadow-sm"
              title={nombre ?? email}
            >
              {getInitials(nombre, email[0]?.toUpperCase())}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] leading-[1.4] break-words whitespace-pre-line text-text">
                {m.descripcion}
              </div>
              <div className="mb-2 flex items-center gap-1 text-[12px] text-muted">
                <span>
                  {formatDateTime(m.fecha)} · {nombre ?? email}
                  {m.tipo && ` · ${m.tipo}`}
                </span>
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      aria-label="Editar movimiento"
                      className="ml-1 flex cursor-pointer text-muted hover:text-blue"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(m.id)}
                      aria-label="Eliminar movimiento"
                      className="flex cursor-pointer text-muted hover:text-red"
                    >
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
