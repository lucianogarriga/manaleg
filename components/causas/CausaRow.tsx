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

const VIA_LABELS: Record<string, string> = {
  "Judicial":               "JUD",
  "Mediación":              "MED",
  "Administrativo":         "ADM",
  "Extrajudicial":          "EXT",
  "Defensa del Consumidor": "DEF",
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
  const viaLabel = causa.via_proceso ? (VIA_LABELS[causa.via_proceso] ?? null) : null;

  if (wide) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`mx-3 my-[5px] flex w-[calc(100%-24px)] cursor-pointer items-center gap-3 rounded-xl border border-l-[3px] px-4 py-[9px] text-left transition-colors duration-100 ${URGENCY_BORDER[urgency]} ${cerrada ? "opacity-55" : ""}`}
        style={{
          background: active ? "var(--color-blue-lt)" : "var(--color-card)",
          borderColor: "var(--color-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,.06)",
        }}
        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
      >
        {/* Carátula + badges debajo */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-text">
            {causa.nro_expediente && (
              <span className="mr-[5px] text-[12px] font-semibold text-sub">
                {causa.nro_expediente} ·
              </span>
            )}
            {causa.caratula}
          </div>
          <div className="mt-[4px] flex flex-wrap items-center gap-[4px]">
            <Badge estado={causa.estado} />
            {viaLabel && (
              <span
                className="rounded-[4px] px-[5px] py-[1px] text-[10px] font-bold text-muted"
                style={{ background: "var(--color-border)" }}
              >
                {viaLabel}
              </span>
            )}
            {causa.tipo_juicio && (
              <span className="text-[11px] text-muted truncate max-w-[160px]">
                {causa.tipo_juicio}
              </span>
            )}
          </div>
        </div>

        {/* Deadline + owner */}
        <div className="flex shrink-0 items-center gap-[6px]">
          <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${URGENCY_DOT[urgency]}`} />
          <span className={`hidden max-w-[160px] truncate text-[11.5px] sm:block ${URGENCY_TEXT[urgency]}`}>
            {deadline}
          </span>
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

  // Variante compacta
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
      <div className="mb-[3px] flex flex-wrap items-center gap-[4px]">
        {causa.nro_expediente && (
          <span className="font-mono text-[11px] text-muted">{causa.nro_expediente}</span>
        )}
        <Badge estado={causa.estado} />
        {causa.tipo_juicio && (
          <span className="text-[11px] text-muted">{causa.tipo_juicio}</span>
        )}
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
