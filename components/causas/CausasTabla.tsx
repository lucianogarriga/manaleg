"use client";

import Badge from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatters";
import {
  URGENCY_DOT,
  URGENCY_LEFT,
  URGENCY_TEXT,
  getRowDeadlineText,
  getVisualUrgency,
} from "@/utils/urgencyHelpers";
import type { CausaConRelaciones } from "@/types";

interface Props {
  causas: CausaConRelaciones[];
  onSelect: (id: string) => void;
}

// Listado de causas: una causa por línea. En pantallas chicas se ocultan columnas secundarias.
export default function CausasTabla({ causas, onSelect }: Props) {
  return (
    <div data-reveal-group className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border text-left text-[12px] font-semibold text-muted">
            <th className="whitespace-nowrap px-3 py-[10px] font-semibold">Expediente</th>
            <th className="px-3 py-[10px] font-semibold">Carátula</th>
            <th className="hidden whitespace-nowrap px-3 py-[10px] font-semibold md:table-cell">Fuero</th>
            <th className="whitespace-nowrap px-3 py-[10px] font-semibold">Estado</th>
            <th className="whitespace-nowrap px-3 py-[10px] font-semibold">Próxima acción</th>
          </tr>
        </thead>
        <tbody>
          {causas.map((causa) => (
            <FilaCausa key={causa.id} causa={causa} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilaCausa({ causa, onSelect }: { causa: CausaConRelaciones; onSelect: (id: string) => void }) {
  const cerrada = causa.estado === "Cerrada";
  const urgencia = getVisualUrgency(causa.proximo_vencimiento, causa.tipo_vencimiento, cerrada);
  const vence = cerrada
    ? `Cerrada ${formatDate(causa.updated_at)}`
    : getRowDeadlineText(causa.proximo_vencimiento, causa.tipo_vencimiento, causa.motivo_vencimiento);

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
        <span className="block truncate font-semibold text-text">{causa.caratula}</span>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-[9px] text-sub md:table-cell">{causa.fuero ?? "—"}</td>
      <td className="whitespace-nowrap px-3 py-[9px]"><Badge estado={causa.estado} /></td>
      <td className="px-3 py-[9px]">
        <div className="flex max-w-[280px] items-center gap-[6px]">
          <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${URGENCY_DOT[urgencia]}`} />
          <span className={`truncate text-[12.5px] ${URGENCY_TEXT[urgencia]}`} title={vence}>{vence}</span>
        </div>
      </td>
    </tr>
  );
}
