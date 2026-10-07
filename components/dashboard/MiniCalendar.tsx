"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { todayISO } from "@/utils/formatters";
import { MESES_FULL } from "@/utils/constants";
import type { AlertaItem } from "@/services/supabase/layoutCounts";
import type { Evento } from "@/types";

const DIAS_SHORT = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MESES = MESES_FULL;

interface MiniCalendarProps {
  alertas: AlertaItem[];
  eventos: (Evento & { caratula: string })[];
}

export function MiniCalendar({ alertas, eventos }: MiniCalendarProps) {
  const hoy = todayISO();
  const [offset, setOffset] = useState(0);

  const { year, month, firstDay, daysInMonth, vencDates, eventDates } = useMemo(() => {
    const base = new Date(`${hoy}T00:00:00Z`);
    base.setUTCMonth(base.getUTCMonth() + offset);
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth();
    const first = new Date(Date.UTC(y, m, 1));
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const pad = (n: number) => String(n).padStart(2, "0");
    const prefix = `${y}-${pad(m + 1)}-`;
    const vencDates = new Set(alertas.filter(a => a.fecha.startsWith(prefix)).map(a => Number(a.fecha.slice(8, 10))));
    const eventDates = new Set(eventos.filter(e => e.fecha.startsWith(prefix)).map(e => Number(e.fecha.slice(8, 10))));
    return { year: y, month: m, firstDay: first.getUTCDay(), daysInMonth: dim, vencDates, eventDates };
  }, [hoy, offset, alertas, eventos]);

  const todayNum = offset === 0 ? Number(hoy.slice(8, 10)) : -1;
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-[11px]">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setOffset(v => v - 1)}
          className="cursor-pointer rounded p-[3px] text-sub"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[13px] font-bold text-text">{MESES[month]} {year}</span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setOffset(v => v + 1)}
          className="cursor-pointer rounded p-[3px] text-sub"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="px-3 pb-3 pt-2">
        <div className="mb-1 grid grid-cols-7 text-center">
          {DIAS_SHORT.map(d => <div key={d} className="text-[10px] font-bold text-muted">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-[2px] text-center">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const isToday = day === todayNum;
            const hasVenc = vencDates.has(day);
            const hasEvento = eventDates.has(day);
            return (
              <div key={day} className="flex flex-col items-center py-[2px]">
                <span
                  className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[12px] font-medium leading-none transition-colors ${isToday ? "bg-blue text-white" : "text-text"}`}
                  onMouseEnter={e => { if (!isToday) (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
                  onMouseLeave={e => { if (!isToday) (e.currentTarget as HTMLElement).style.background = ""; }}
                >{day}</span>
                <div className="mt-[2px] flex gap-[2px]">
                  {hasVenc && <span className="h-[4px] w-[4px] rounded-full bg-red" />}
                  {hasEvento && <span className="h-[4px] w-[4px] rounded-full bg-blue" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-4 border-t border-border/60 px-4 py-[8px]">
        <span className="flex items-center gap-1 text-[10.5px] text-muted"><span className="h-[6px] w-[6px] rounded-full bg-red" /> Vencimiento</span>
        <span className="flex items-center gap-1 text-[10.5px] text-muted"><span className="h-[6px] w-[6px] rounded-full bg-blue" /> Evento</span>
      </div>
    </div>
  );
}
