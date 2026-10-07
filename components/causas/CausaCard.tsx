"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate, getInitials } from "@/utils/formatters";
import {
  URGENCY_DOT,
  URGENCY_LEFT,
  URGENCY_TEXT,
  getRowDeadlineText,
  getVisualUrgency,
} from "@/utils/urgencyHelpers";
import type { CausaConRelaciones } from "@/types";

interface CausaCardProps {
  causa: CausaConRelaciones;
  active: boolean;
  onSelect: () => void;
}

export default function CausaCard({ causa, active, onSelect }: CausaCardProps) {
  const [hovered, setHovered] = useState(false);
  const cerrada = causa.estado === "Cerrada";
  const urgency = getVisualUrgency(causa.proximo_vencimiento, causa.tipo_vencimiento, cerrada);
  const deadline = cerrada
    ? `Cerrada ${formatDate(causa.updated_at)}`
    : getRowDeadlineText(causa.proximo_vencimiento, causa.tipo_vencimiento, causa.motivo_vencimiento);
  const initials = getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase());

  const bg = active ? "var(--color-blue-lt)" : hovered ? "var(--hover-row)" : "var(--color-card)";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full cursor-pointer flex-col gap-[5px] overflow-hidden rounded-xl border border-l-[3px] px-[10px] py-[9px] text-left ${cerrada ? "opacity-55" : ""}`}
      style={{
        background: bg,
        borderColor: "var(--color-border)",
        borderLeftColor: URGENCY_LEFT[urgency],
        transition: "background-color 140ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Encabezado: carátula + badge estado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 text-[11.5px] font-semibold leading-snug text-text line-clamp-2 sm:text-[12.5px]">
          {causa.caratula}
        </div>
        <Badge estado={causa.estado} />
      </div>

      {/* Expediente + Fuero / Juzgado en una línea */}
      {(causa.nro_expediente || causa.fuero || causa.juzgado_camara) && (
        <div className="truncate text-[10.5px] text-sub sm:text-[11.5px]">
          {[
            causa.nro_expediente,
            causa.fuero,
            causa.juzgado_camara,
          ].filter(Boolean).join(" · ")}
        </div>
      )}

      {/* Footer: deadline + owner */}
      <div className="mt-auto flex items-center gap-[5px] border-t pt-[5px]" style={{ borderColor: "var(--color-border)" }}>
        <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${URGENCY_DOT[urgency]}`} />
        <span className={`flex-1 truncate text-[10px] sm:text-[11px] ${URGENCY_TEXT[urgency]}`}>{deadline}</span>
        <span
          className="shrink-0 rounded-[4px] px-[5px] py-px text-[10px] font-bold text-sub"
          style={{ background: "var(--color-border)" }}
          title={causa.owner?.nombre_completo ?? undefined}
        >
          {initials}
        </span>
      </div>
    </button>
  );
}
