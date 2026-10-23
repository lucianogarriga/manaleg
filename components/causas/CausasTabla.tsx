"use client";

import Badge from "@/components/ui/Badge";
import { formatDate, getInitials } from "@/utils/formatters";
import {
  URGENCY_DOT,
  URGENCY_LEFT,
  URGENCY_TEXT,
  getRowDeadlineText,
  getVisualUrgency,
} from "@/utils/urgencyHelpers";
import { VIA_LABELS } from "@/utils/constants";
import type { CausaConRelaciones } from "@/types";
import type { PresenceUser } from "@/services/presence/canalesCausa";
import AvataresEnLinea from "./AvataresEnLinea";

interface Props {
  causas: CausaConRelaciones[];
  enLineaPorCausa: Record<string, PresenceUser[]>;
  onSelect: (id: string) => void;
}

// Listado de causas: una causa por línea. En pantallas chicas se ocultan columnas secundarias.
export default function CausasTabla({ causas, enLineaPorCausa, onSelect }: Props) {
  return (
    <div data-reveal-group className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border text-left text-[12px] font-semibold text-muted">
            <th className="whitespace-nowrap px-3 py-[10px] font-semibold">Expediente</th>
            <th className="px-3 py-[10px] font-semibold">Carátula</th>
            <th className="hidden whitespace-nowrap px-3 py-[10px] font-semibold md:table-cell">Fuero</th>
            <th className="hidden whitespace-nowrap px-3 py-[10px] font-semibold md:table-cell">Responsable</th>
            <th className="whitespace-nowrap px-3 py-[10px] font-semibold">Estado</th>
            <th className="whitespace-nowrap px-3 py-[10px] font-semibold">Próxima acción</th>
            <th className="hidden whitespace-nowrap px-3 py-[10px] font-semibold lg:table-cell">Vía</th>
          </tr>
        </thead>
        <tbody>
          {causas.map((causa) => (
            <FilaCausa
              key={causa.id}
              causa={causa}
              enLinea={enLineaPorCausa[causa.id] ?? []}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilaCausa({ causa, enLinea, onSelect }: { causa: CausaConRelaciones; enLinea: PresenceUser[]; onSelect: (id: string) => void }) {
  const cerrada = causa.estado === "Cerrada";
  const urgencia = getVisualUrgency(causa.proximo_vencimiento, causa.tipo_vencimiento, cerrada);
  const vence = cerrada
    ? `Cerrada ${formatDate(causa.updated_at)}`
    : getRowDeadlineText(causa.proximo_vencimiento, causa.tipo_vencimiento, causa.motivo_vencimiento);
  const responsable = causa.owner?.nombre_completo ?? causa.owner?.email ?? "—";
  const iniciales = getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase());
  const via = causa.via_proceso ? (VIA_LABELS[causa.via_proceso] ?? causa.via_proceso) : causa.tipo_juicio ?? "—";

  return (
    <tr
      tabIndex={0}
      onClick={() => onSelect(causa.id)}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(causa.id); }}
      className={`cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-[var(--hover-row)] focus-visible:bg-[var(--hover-row)] focus-visible:outline-none ${cerrada ? "opacity-55" : ""}`}
    >
      <td className="whitespace-nowrap px-3 py-[9px] font-semibold text-sub" style={{ boxShadow: `inset 3px 0 0 ${URGENCY_LEFT[urgencia]}` }}>
        {causa.nro_expediente ?? <span className="font-normal italic text-muted">Sin nro.</span>}
      </td>
      <td className="max-w-[360px] px-3 py-[9px]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-text">{causa.caratula}</span>
          <AvataresEnLinea users={enLinea} />
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-[9px] text-sub md:table-cell">{causa.fuero ?? "—"}</td>
      <td className="hidden px-3 py-[9px] md:table-cell">
        <div className="flex items-center gap-2">
          <span className="rounded-[4px] px-[5px] py-px text-[10px] font-bold text-sub" style={{ background: "var(--color-border)" }}>{iniciales}</span>
          <span className="max-w-[160px] truncate text-sub">{responsable}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-[9px]"><Badge estado={causa.estado} /></td>
      <td className="px-3 py-[9px]">
        <div className="flex max-w-[280px] items-center gap-[6px]">
          <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${URGENCY_DOT[urgencia]}`} />
          <span className={`truncate text-[12.5px] ${URGENCY_TEXT[urgencia]}`} title={vence}>{vence}</span>
        </div>
      </td>
      <td className="hidden max-w-[180px] truncate px-3 py-[9px] text-sub lg:table-cell">{via}</td>
    </tr>
  );
}
