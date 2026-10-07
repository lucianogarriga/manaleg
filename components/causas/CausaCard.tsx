"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate, getInitials } from "@/utils/formatters";
import {
  URGENCY_DOT,
  URGENCY_TEXT,
  getRowDeadlineText,
  getUrgency,
} from "@/utils/urgencyHelpers";
import type { CausaConRelaciones } from "@/types";
import type { Urgency } from "@/utils/urgencyHelpers";

const URGENCY_LEFT: Record<Urgency, string> = {
  red:   "var(--color-red)",
  amber: "var(--color-amb)",
  green: "var(--color-grn)",
  none:  "var(--color-border)",
};

interface CausaCardProps {
  causa: CausaConRelaciones;
  active: boolean;
  onSelect: () => void;
}

export default function CausaCard({ causa, active, onSelect }: CausaCardProps) {
  const [hovered, setHovered] = useState(false);
  const cerrada = causa.estado === "Cerrada";
  const urgency = getUrgency(causa.proximo_vencimiento, cerrada);
  const deadline = cerrada
    ? `Cerrada ${formatDate(causa.updated_at)}`
    : getRowDeadlineText(causa.proximo_vencimiento, causa.tipo_vencimiento, causa.motivo_vencimiento);
  const initials = getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase());

  const bg = active ? "var(--color-blue-lt)" : hovered ? "var(--hover-row)" : "var(--color-card)";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full cursor-pointer flex-col gap-2 overflow-hidden rounded-xl border border-l-[3px] p-4 text-left ${cerrada ? "opacity-55" : ""}`}
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
        <div className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug text-text line-clamp-2">
          {causa.caratula}
        </div>
        <Badge estado={causa.estado} />
      </div>

      {/* Expediente */}
      {causa.nro_expediente && (
        <div className="text-[11.5px] font-semibold text-sub">Expte. N° {causa.nro_expediente}</div>
      )}

      {/* Fuero / Juzgado */}
      {(causa.fuero || causa.juzgado_camara) && (
        <div className="text-[11.5px] text-sub truncate">
          {[causa.fuero, causa.juzgado_camara].filter(Boolean).join(" · ")}
        </div>
      )}

      {/* Footer: deadline + owner */}
      <div className="mt-auto flex items-center gap-[5px] border-t pt-[7px]" style={{ borderColor: "var(--color-border)" }}>
        <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${URGENCY_DOT[urgency]}`} />
        <span className={`flex-1 truncate text-[11px] ${URGENCY_TEXT[urgency]}`}>{deadline}</span>
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
