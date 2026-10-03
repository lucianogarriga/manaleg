"use client";

import { useRouter } from "next/navigation";
import { useCausasStore } from "@/store/causasStore";
import { getDaysUntil, formatDate } from "@/utils/formatters";
import type { VencimientoItem } from "@/services/supabase/vencimientos";

const GRUPOS = [
  { label: "Vencidos", min: -Infinity, max: -1, style: "text-red font-semibold" },
  { label: "Hoy", min: 0, max: 0, style: "text-red font-semibold" },
  { label: "Próximos 3 días", min: 1, max: 3, style: "text-amb font-semibold" },
  { label: "Próximos 7 días", min: 4, max: 7, style: "text-amb font-semibold" },
  { label: "Próximos 30 días", min: 8, max: 30, style: "text-text font-semibold" },
  { label: "Más adelante", min: 31, max: Infinity, style: "text-sub font-semibold" },
] as const;

interface VencimientosViewProps {
  items: VencimientoItem[];
}

function BucketSection({ label, style, items, onSelect }: {
  label: string;
  style: string;
  items: VencimientoItem[];
  onSelect: (causaId: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <div className="mb-[6px] flex items-center gap-2 px-4 md:px-6">
        <h3 className={`text-[12px] uppercase tracking-[.5px] ${style}`}>{label}</h3>
        <span className="text-[11px] text-muted">({items.length})</span>
      </div>
      <div className="overflow-hidden rounded-[8px] border border-border bg-card mx-4 md:mx-6">
        {items.map((item, i) => {
          const days = getDaysUntil(item.fecha) ?? 0;
          const daysLabel =
            days < 0 ? `Vencido hace ${-days} ${-days === 1 ? "día" : "días"}`
            : days === 0 ? "Vence hoy"
            : `En ${days} ${days === 1 ? "día" : "días"}`;

          return (
            <button
              key={item.causaId}
              type="button"
              onClick={() => onSelect(item.causaId)}
              className="block w-full cursor-pointer border-b border-b-border px-[14px] py-[10px] text-left last:border-b-0 transition-colors bg-card"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-card)"; }}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 pt-px text-right">
                  <div className="text-[13px] font-bold text-text tabular-nums">{formatDate(item.fecha)}</div>
                  <div className={`text-[11px] ${days <= 0 ? "text-red" : days <= 3 ? "text-amb" : "text-muted"}`}>
                    {daysLabel}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-text">{item.caratula}</div>
                  {item.motivo && (
                    <div className="truncate text-[12px] text-sub">{item.motivo}</div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.tipo && (
                    <span className={`rounded-[4px] px-2 py-[2px] text-[11px] font-medium ${
                      item.tipo === "Vencimiento"
                        ? "bg-red-lt text-red"
                        : "bg-amb-lt text-amb"
                    }`}>
                      {item.tipo}
                    </span>
                  )}
                  <span className="hidden rounded-[4px] px-2 py-[2px] text-[11px] text-sub sm:block" style={{ background: "var(--color-border)" }}>
                    {item.estado}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function VencimientosView({ items }: VencimientosViewProps) {
  const router = useRouter();
  const selectCausa = useCausasStore((s) => s.select);

  const goToCausa = (causaId: string) => {
    selectCausa(causaId);
    router.push("/causas");
  };

  const grouped = GRUPOS.map((g) => ({
    ...g,
    items: items.filter((item) => {
      const d = getDaysUntil(item.fecha) ?? 0;
      return d >= g.min && d <= g.max;
    }),
  }));

  const total = items.length;

  return (
    <div className="overflow-y-auto py-4">
      <div className="mb-4 px-4 md:px-6">
        <p className="text-[13px] text-muted">
          {total === 0
            ? "Ninguna causa tiene vencimiento cargado."
            : `${total} ${total === 1 ? "vencimiento" : "vencimientos"} en total · clic para ir a la causa`}
        </p>
      </div>

      {total === 0 ? (
        <div className="px-4 md:px-6">
          <p className="py-8 text-center text-[13px] text-muted">
            Cargá vencimientos desde el detalle de cada causa.
          </p>
        </div>
      ) : (
        grouped.map((g) => (
          <BucketSection
            key={g.label}
            label={g.label}
            style={g.style}
            items={g.items}
            onSelect={goToCausa}
          />
        ))
      )}
    </div>
  );
}
