"use client";

import { useMemo } from "react";
import { ESTADOS_CAUSA, ESTADO_STYLES } from "@/utils/constants";
import { URGENCY_DOT, URGENCY_TEXT, getRowDeadlineText, getUrgency } from "@/utils/urgencyHelpers";
import { formatDate } from "@/utils/formatters";
import Badge from "@/components/ui/Badge";
import { useCausasStore } from "@/store/causasStore";
import CausaModal from "@/components/causas/CausaModal";
import type { CausaConRelaciones, EstadoCausa } from "@/types";

const COLUMN_COLORS: Record<EstadoCausa, string> = {
  "Iniciada":       "#7c3aed",
  "En trámite":     "#2563eb",
  "Con resolución": "#047857",
  "En ejecución":   "#b45309",
  "Cerrada":        "#64748b",
};

interface KanbanViewProps {
  causas: CausaConRelaciones[];
  userId: string;
}

export default function KanbanView({ causas, userId }: KanbanViewProps) {
  const selectedId = useCausasStore((s) => s.selectedId);
  const select = useCausasStore((s) => s.select);

  const columns = useMemo(() => {
    const map = Object.fromEntries(ESTADOS_CAUSA.map((e) => [e, [] as CausaConRelaciones[]]));
    for (const c of causas) {
      if (map[c.estado]) map[c.estado].push(c);
    }
    return ESTADOS_CAUSA.map((estado) => ({ estado, items: map[estado] }));
  }, [causas]);

  const selected = causas.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-1 gap-3 overflow-x-auto p-4">
          {columns.map(({ estado, items }) => {
            const color = COLUMN_COLORS[estado];
            const styles = ESTADO_STYLES[estado];

            return (
              <div
                key={estado}
                className="flex w-[240px] shrink-0 flex-col gap-2 rounded-xl p-3"
                style={{ background: "var(--color-bg)", minHeight: "100%" }}
              >
                {/* Encabezado columna */}
                <div className="flex items-center gap-2 pb-1">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-[12.5px] font-semibold text-text">{estado}</span>
                  <span
                    className={`ml-auto rounded-full px-[7px] py-px text-[10px] font-bold ${styles.bg} ${styles.text}`}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Cards de causa */}
                <div className="flex flex-1 flex-col gap-2">
                  {items.map((causa) => {
                    const cerrada = causa.estado === "Cerrada";
                    const urgency = getUrgency(causa.proximo_vencimiento, cerrada);
                    const deadline = cerrada
                      ? `Cerrada ${formatDate(causa.updated_at)}`
                      : getRowDeadlineText(
                          causa.proximo_vencimiento,
                          causa.tipo_vencimiento,
                          causa.motivo_vencimiento,
                        );

                    return (
                      <button
                        key={causa.id}
                        type="button"
                        onClick={() => select(causa.id)}
                        className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors duration-100 ${cerrada ? "opacity-55" : ""}`}
                        style={{
                          background: "var(--color-card)",
                          borderColor: "var(--color-border)",
                          borderLeftWidth: "3px",
                          borderLeftColor: color,
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-card)"; }}
                      >
                        <div className="mb-[6px] text-[12.5px] font-semibold leading-snug text-text line-clamp-2">
                          {causa.caratula}
                        </div>
                        {causa.nro_expediente && (
                          <div className="mb-1 font-mono text-[10px] text-muted">
                            {causa.nro_expediente}
                          </div>
                        )}
                        <div className="flex items-center gap-[5px]">
                          <span className={`h-[5px] w-[5px] shrink-0 rounded-full ${URGENCY_DOT[urgency]}`} />
                          <span className={`flex-1 truncate text-[10.5px] ${URGENCY_TEXT[urgency]}`}>
                            {deadline}
                          </span>
                          <Badge estado={causa.estado} />
                        </div>
                      </button>
                    );
                  })}

                  {items.length === 0 && (
                    <div
                      className="rounded-lg border border-dashed p-4 text-center text-[11px] text-muted"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      Sin causas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && <CausaModal causa={selected} userId={userId} />}
    </>
  );
}
