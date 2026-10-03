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

const VIA_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "Judicial":       { bg: "rgba(37,99,235,.12)",  text: "#2563eb", label: "JUD" },
  "Mediación":      { bg: "rgba(124,58,237,.12)", text: "#7c3aed", label: "MED" },
  "Administrativo": { bg: "rgba(4,120,87,.12)",   text: "#047857", label: "ADM" },
  "Extrajudicial":  { bg: "rgba(180,83,9,.12)",   text: "#b45309", label: "EXT" },
};

interface CausaRowProps {
  causa: CausaConRelaciones;
  active: boolean;
  onSelect: () => void;
  wide?: boolean;
}

export default function CausaRow({ causa, active, onSelect, wide = false }: CausaRowProps) {
  const cerrada = causa.estado === "Cerrada";
  const urgency = getUrgency(causa.proximo_vencimiento, cerrada);
  const deadline = cerrada
    ? `Cerrada ${formatDate(causa.updated_at)}`
    : getRowDeadlineText(causa.proximo_vencimiento, causa.tipo_vencimiento, causa.motivo_vencimiento);
  const initials = getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase());
  const via = causa.via_proceso ? VIA_STYLES[causa.via_proceso] : null;

  if (wide) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`mx-3 my-[5px] flex w-[calc(100%-24px)] cursor-pointer items-center gap-3 rounded-xl border border-l-[3px] px-4 py-[10px] text-left transition-colors duration-100 ${URGENCY_BORDER[urgency]} ${cerrada ? "opacity-55" : ""}`}
        style={{
          background: active ? "var(--color-blue-lt)" : "var(--color-card)",
          borderColor: "var(--color-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,.06)",
        }}
        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
      >
        {/* Badges estado + vía */}
        <div className="flex shrink-0 items-center gap-[5px]">
          <Badge estado={causa.estado} />
          {via && (
            <span
              className="rounded-[5px] px-[6px] py-[2px] text-[10px] font-bold"
              style={{ background: via.bg, color: via.text }}
            >
              {via.label}
            </span>
          )}
        </div>

        {/* Carátula con expte inline */}
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-text">
          {causa.nro_expediente && (
            <span className="mr-[6px]">
              Expte N° {causa.nro_expediente} ·
            </span>
          )}
          {causa.caratula}
        </span>

        {/* Deadline + owner */}
        <div className="flex shrink-0 items-center gap-[6px]">
          <span className={`h-[6px] w-[6px] rounded-full ${URGENCY_DOT[urgency]}`} />
          <span className={`hidden text-[12px] sm:block ${URGENCY_TEXT[urgency]}`}>{deadline}</span>
          <span
            className="rounded-[4px] px-[5px] py-px text-[10px] font-bold text-sub"
            style={{ background: "var(--color-border)" }}
            title={causa.owner?.nombre_completo ?? undefined}
          >
            {initials}
          </span>
        </div>
      </button>
    );
  }

  // Variante compacta (panel lateral, no usada actualmente)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full cursor-pointer border-b border-l-[3px] px-[13px] py-[9px] text-left transition-colors duration-100 ${URGENCY_BORDER[urgency]} ${cerrada ? "opacity-55" : ""}`}
      style={{
        borderBottomColor: "var(--color-border)",
        background: active ? "var(--color-blue-lt)" : undefined,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      <div className="mb-[3px] truncate text-[13.5px] font-semibold text-text">{causa.caratula}</div>
      <div className="mb-[3px] flex items-center gap-[5px]">
        {causa.nro_expediente && (
          <span className="truncate font-mono text-[11px] text-muted">{causa.nro_expediente}</span>
        )}
        <Badge estado={causa.estado} />
      </div>
      <div className="flex items-center gap-[5px]">
        <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${URGENCY_DOT[urgency]}`} />
        <span className={`truncate text-[11px] ${URGENCY_TEXT[urgency]}`}>{deadline}</span>
        <span
          className="ml-auto shrink-0 rounded-[4px] px-[5px] py-px text-[10px] font-bold text-sub"
          style={{ background: "var(--color-border)" }}
          title={causa.owner?.nombre_completo ?? undefined}
        >
          {initials}
        </span>
      </div>
    </button>
  );
}
