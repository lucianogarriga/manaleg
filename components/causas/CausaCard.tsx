"use client";

import Badge from "@/components/ui/Badge";
import { formatDate, getInitials } from "@/utils/formatters";
import {
  URGENCY_BORDER,
  URGENCY_DOT,
  URGENCY_TEXT,
  getRowDeadlineText,
  getUrgency,
} from "@/utils/urgencyHelpers";
import type { CausaConRelaciones } from "@/types";

interface CausaCardProps {
  causa: CausaConRelaciones;
  active: boolean;
  onSelect: () => void;
}

export default function CausaCard({ causa, active, onSelect }: CausaCardProps) {
  const cerrada = causa.estado === "Cerrada";
  const urgency = getUrgency(causa.proximo_vencimiento, cerrada);
  const deadline = cerrada
    ? `Cerrada ${formatDate(causa.updated_at)}`
    : getRowDeadlineText(causa.proximo_vencimiento, causa.tipo_vencimiento, causa.motivo_vencimiento);
  const initials = getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase());

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-l-[3px] p-4 text-left transition-colors duration-100 ${URGENCY_BORDER[urgency]} ${cerrada ? "opacity-55" : ""}`}
      style={{
        background: active ? "var(--color-blue-lt)" : "var(--color-card)",
        borderColor: `var(--color-border)`,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = active ? "var(--color-blue-lt)" : "var(--color-card)"; }}
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
        <div className="font-mono text-[11px] text-muted">{causa.nro_expediente}</div>
      )}

      {/* Fuero / Juzgado */}
      {(causa.fuero || causa.juzgado_camara) && (
        <div className="text-[11.5px] text-sub truncate">
          {[causa.fuero, causa.juzgado_camara].filter(Boolean).join(" · ")}
        </div>
      )}

      {/* Footer: deadline + owner */}
      <div className="flex items-center gap-[5px] pt-1 border-t" style={{ borderColor: "var(--color-border)" }}>
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
