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

interface CausaRowProps {
  causa: CausaConRelaciones;
  active: boolean;
  onSelect: () => void;
  wide?: boolean;
}

export default function CausaRow({ causa, active, onSelect, wide = false }: CausaRowProps) {
  const cerrada = causa.estado === "Cerrada";
  const urgency = getUrgency(causa.proximo_vencimiento, cerrada);

  const border = active && urgency === "none" ? "border-l-blue" : URGENCY_BORDER[urgency];
  const deadline = cerrada
    ? `Cerrada ${formatDate(causa.updated_at)}`
    : getRowDeadlineText(causa.proximo_vencimiento, causa.tipo_vencimiento, causa.motivo_vencimiento);
  const initials = getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase());

  if (wide) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full cursor-pointer border-b border-b-slate-100 border-l-[3px] px-[16px] py-[11px] text-left transition-colors duration-100 ${border} ${
          active ? "bg-blue-lt" : "hover:bg-[#FAFAFA]"
        } ${cerrada ? "opacity-55" : ""}`}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-[3px] truncate text-[14.5px] font-semibold text-text leading-snug">
              {causa.caratula}
            </div>
            <div className="flex items-center gap-[5px]">
              <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${URGENCY_DOT[urgency]}`} />
              <span className={`truncate text-[12px] ${URGENCY_TEXT[urgency]}`}>{deadline}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-[5px] pt-[1px]">
            {causa.nro_expediente && (
              <span className="font-mono text-[11px] text-muted">{causa.nro_expediente}</span>
            )}
            <Badge estado={causa.estado} />
            <span
              className="rounded-[4px] bg-slate-100 px-[5px] py-px text-[10px] font-bold text-sub"
              title={causa.owner?.nombre_completo ?? undefined}
            >
              {initials}
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full cursor-pointer border-b border-b-slate-100 border-l-[3px] px-[13px] py-[9px] text-left transition-colors duration-100 ${border} ${
        active ? "bg-blue-lt" : "hover:bg-[#FAFAFA]"
      } ${cerrada ? "opacity-55" : ""}`}
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
          className="ml-auto shrink-0 rounded-[4px] bg-slate-100 px-[5px] py-px text-[10px] font-bold text-sub"
          title={causa.owner?.nombre_completo ?? undefined}
        >
          {initials}
        </span>
      </div>
    </button>
  );
}
