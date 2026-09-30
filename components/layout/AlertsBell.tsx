"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock } from "lucide-react";
import { useCausasStore } from "@/store/causasStore";
import { getDaysUntil } from "@/utils/formatters";
import { URGENCY_DOT, getDeadlineLabel, getUrgency } from "@/utils/urgencyHelpers";
import type { AlertaItem } from "@/services/supabase/layoutCounts";

interface AlertsBellProps {
  alertas: AlertaItem[];
  urgentes: number; // número del badge
}

const GRUPOS = [
  { titulo: "Vencidos", match: (d: number) => d < 0 },
  { titulo: "Próximos 7 días", match: (d: number) => d >= 0 && d <= 7 },
  { titulo: "Más adelante", match: (d: number) => d > 7 },
];

export default function AlertsBell({ alertas, urgentes }: AlertsBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Abre la causa en el listado (sin filtros que puedan ocultarla)
  const goToCausa = (causaId: string) => {
    const { select, setFilter, setSearch } = useCausasStore.getState();
    setFilter("todas");
    setSearch("");
    select(causaId);
    setOpen(false);
    router.push("/causas");
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Alertas y vencimientos (${urgentes} urgentes)`}
        aria-expanded={open}
        className="relative flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full bg-amb-lt text-amb"
      >
        <Bell size={15} />
        {urgentes > 0 && (
          <span className="absolute -top-px -right-px flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red px-[3px] text-[9.5px] font-bold text-white">
            {urgentes}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[52px] z-40 max-h-[70vh] overflow-y-auto rounded-[8px] border border-border bg-card shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[400px]">
          <div className="sticky top-0 border-b border-border bg-card px-[13px] py-[9px] text-[12px] font-bold uppercase tracking-[.4px] text-sub">
            Próximas alertas y vencimientos
          </div>

          {alertas.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13.5px] text-muted">
              No tenés alertas ni vencimientos en los próximos 30 días.
            </p>
          ) : (
            GRUPOS.map((grupo) => {
              const items = alertas.filter((a) => grupo.match(getDaysUntil(a.fecha) ?? 99));
              if (items.length === 0) return null;
              return (
                <div key={grupo.titulo}>
                  <div className="bg-bg px-[13px] py-[5px] text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
                    {grupo.titulo} ({items.length})
                  </div>
                  {items.map((a) => {
                    const urgency = getUrgency(a.fecha);
                    const Icon = a.tipo === "Alerta" ? Bell : CalendarClock;
                    return (
                      <button
                        key={a.causaId}
                        type="button"
                        onClick={() => goToCausa(a.causaId)}
                        className="flex w-full cursor-pointer items-start gap-[9px] border-b border-slate-100 px-[13px] py-[9px] text-left hover:bg-bg"
                      >
                        <span className={`mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full ${URGENCY_DOT[urgency]}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-text">{a.caratula}</span>
                          <span className="mt-px flex items-center gap-1 text-[12.5px] text-sub">
                            <Icon size={10} className="shrink-0" />
                            <span className="truncate">{a.motivo ?? a.tipo ?? "Vencimiento"}</span>
                          </span>
                        </span>
                        <span
                          className={`shrink-0 pt-px text-[12px] ${urgency === "red" ? "font-semibold text-red" : urgency === "amber" ? "text-amb" : "text-muted"}`}
                        >
                          {getDeadlineLabel(a.fecha, a.tipo)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
