"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Calendar, FileText, AlertTriangle, Scale, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { addDaysISO, formatDate, getDaysUntil, todayISO } from "@/utils/formatters";
import { getDeadlineLabel, getUrgency, URGENCY_TEXT } from "@/utils/urgencyHelpers";
import type { AlertaItem } from "@/services/supabase/layoutCounts";
import type { Evento } from "@/types";

const TIPO_BADGE: Record<string, { bg: string; text: string }> = {
  Audiencia: { bg: "bg-blue-lt", text: "text-blue" },
  Mediación: { bg: "bg-pur-lt", text: "text-pur" },
  Pericial:  { bg: "bg-amb-lt", text: "text-amb" },
  Reunión:   { bg: "bg-grn-lt", text: "text-grn" },
  Otro:      { bg: "bg-border", text: "text-sub" },
};

const DIAS_SHORT = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface Props {
  nombre: string;
  causasActivas: number;
  alertas: AlertaItem[];
  eventos: (Evento & { caratula: string })[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  accent?: "red" | "amber" | "blue";
}) {
  const numColor =
    accent === "red" ? "text-red" :
    accent === "amber" ? "text-amb" :
    "text-blue";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className={`text-[28px] font-bold leading-none ${numColor}`}>{value}</div>
        <div className="mt-[5px] text-[12.5px] font-medium text-sub">{label}</div>
        {sub && <div className="mt-[2px] text-[11px] text-muted">{sub}</div>}
      </div>
    </div>
  );
}

function MiniCalendar({
  alertas,
  eventos,
}: {
  alertas: AlertaItem[];
  eventos: (Evento & { caratula: string })[];
}) {
  const hoy = todayISO();
  const [offset, setOffset] = useState(0); // meses desde hoy

  const { year, month, firstDay, daysInMonth, vencDates, eventDates } = useMemo(() => {
    const base = new Date(`${hoy}T00:00:00Z`);
    base.setUTCMonth(base.getUTCMonth() + offset);
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth(); // 0-based
    const first = new Date(Date.UTC(y, m, 1));
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

    const pad = (n: number) => String(n).padStart(2, "0");
    const prefix = `${y}-${pad(m + 1)}-`;

    const vencDates = new Set(
      alertas.filter((a) => a.fecha.startsWith(prefix)).map((a) => Number(a.fecha.slice(8, 10)))
    );
    const eventDates = new Set(
      eventos.filter((e) => e.fecha.startsWith(prefix)).map((e) => Number(e.fecha.slice(8, 10)))
    );

    return { year: y, month: m, firstDay: first.getUTCDay(), daysInMonth: dim, vencDates, eventDates };
  }, [hoy, offset, alertas, eventos]);

  const todayNum = offset === 0 ? Number(hoy.slice(8, 10)) : -1;
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
      {/* Header mes */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-[11px]">
        <button
          type="button"
          onClick={() => setOffset((v) => v - 1)}
          className="cursor-pointer rounded p-[3px] text-sub transition-colors"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[13px] font-bold text-text">
          {MESES[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setOffset((v) => v + 1)}
          className="cursor-pointer rounded p-[3px] text-sub transition-colors"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="px-3 pb-3 pt-2">
        {/* Días de semana */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {DIAS_SHORT.map((d) => (
            <div key={d} className="text-[10px] font-bold text-muted">{d}</div>
          ))}
        </div>
        {/* Días */}
        <div className="grid grid-cols-7 gap-y-[2px] text-center">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const isToday = day === todayNum;
            const hasVenc = vencDates.has(day);
            const hasEvento = eventDates.has(day);
            return (
              <div key={day} className="flex flex-col items-center py-[2px]">
                <span
                  className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[12px] font-medium leading-none transition-colors
                    ${isToday ? "bg-blue text-white" : "text-text"}`}
                  style={!isToday ? undefined : undefined}
                  onMouseEnter={(e) => { if (!isToday) (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
                  onMouseLeave={(e) => { if (!isToday) (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  {day}
                </span>
                {/* dots */}
                <div className="mt-[2px] flex gap-[2px]">
                  {hasVenc && <span className="h-[4px] w-[4px] rounded-full bg-red" />}
                  {hasEvento && <span className="h-[4px] w-[4px] rounded-full bg-blue" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 border-t border-border/60 px-4 py-[8px]">
        <span className="flex items-center gap-1 text-[10.5px] text-muted">
          <span className="h-[6px] w-[6px] rounded-full bg-red" /> Vencimiento
        </span>
        <span className="flex items-center gap-1 text-[10.5px] text-muted">
          <span className="h-[6px] w-[6px] rounded-full bg-blue" /> Evento
        </span>
      </div>
    </div>
  );
}

export default function DashboardView({ nombre, causasActivas, alertas, eventos }: Props) {
  const hoy = todayISO();
  const semana = addDaysISO(hoy, 7);

  const vencenSemana = alertas.filter((a) => a.fecha >= hoy && a.fecha <= semana).length;
  const vencidos = alertas.filter((a) => a.fecha < hoy).length;
  const eventosSemana = eventos.filter((e) => e.fecha >= hoy && e.fecha <= semana).length;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const primerNombre = nombre.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-text">
          {saludo}, {primerNombre}
        </h1>
        <p className="mt-[2px] text-[13.5px] text-sub">
          {formatDate(hoy)} · Resumen de tu actividad
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Scale} label="Causas activas" value={causasActivas} />
        <StatCard
          icon={AlertTriangle}
          label="Vencen esta semana"
          value={vencenSemana}
          sub={vencidos > 0 ? `${vencidos} vencido${vencidos > 1 ? "s" : ""}` : undefined}
          accent={vencidos > 0 ? "red" : vencenSemana > 0 ? "amber" : "blue"}
        />
        <StatCard
          icon={Calendar}
          label="Eventos esta semana"
          value={eventosSemana}
          accent={eventosSemana > 0 ? "blue" : undefined}
        />
        <StatCard icon={FileText} label="Próximos 30 días" value={alertas.length} />
      </div>

      {/* Layout principal: calendario izquierda | paneles derecha */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Calendario mini */}
        <div className="w-full sm:w-[290px] sm:shrink-0">
          <MiniCalendar alertas={alertas} eventos={eventos} />
        </div>

        {/* Paneles derecha: vencimientos + eventos */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Próximos vencimientos */}
          <div className="rounded-xl border border-border bg-card shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-[11px]">
              <span className="text-[12px] font-bold uppercase tracking-[.5px] text-sub">
                Vencimientos próximos
              </span>
              <Link href="/vencimientos" className="text-[12px] font-semibold text-blue hover:underline">
                Ver todos
              </Link>
            </div>
            {alertas.length === 0 ? (
              <p className="px-4 py-5 text-[13.5px] text-muted">Sin vencimientos en los próximos 30 días.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {alertas.slice(0, 6).map((a) => {
                  const urgency = getUrgency(a.fecha);
                  const label = getDeadlineLabel(a.fecha, a.tipo);
                  return (
                    <li key={a.causaId} className="flex items-start gap-3 px-4 py-[10px]">
                      <span className={`mt-[3px] shrink-0 text-[11px] font-semibold ${URGENCY_TEXT[urgency]}`}>
                        {label}
                      </span>
                      <div className="min-w-0 flex-1 text-right">
                        <p className="truncate text-[13px] text-text">{a.caratula}</p>
                        {a.motivo && (
                          <p className="truncate text-[11.5px] text-muted">{a.motivo}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="rounded-xl border border-border bg-card shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-[11px]">
              <span className="text-[12px] font-bold uppercase tracking-[.5px] text-sub">
                Próximos eventos
              </span>
              <Link href="/causas" className="text-[12px] font-semibold text-blue hover:underline">
                Ver causas
              </Link>
            </div>
            {eventos.length === 0 ? (
              <p className="px-4 py-5 text-[13.5px] text-muted">Sin eventos en los próximos 30 días.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {eventos.slice(0, 6).map((e) => {
                  const style = TIPO_BADGE[e.tipo] ?? TIPO_BADGE.Otro;
                  const dias = getDaysUntil(e.fecha);
                  const fechaLabel =
                    dias === 0 ? "Hoy" :
                    dias === 1 ? "Mañana" :
                    formatDate(e.fecha);
                  return (
                    <li key={e.id} className="flex items-start gap-3 px-4 py-[10px]">
                      <span className={`mt-[1px] shrink-0 rounded-[4px] px-[6px] py-[2px] text-[10px] font-semibold ${style.bg} ${style.text}`}>
                        {e.tipo}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-text">{e.titulo}</p>
                        <p className="truncate text-[11.5px] text-muted">{e.caratula}</p>
                      </div>
                      <span className="shrink-0 text-[11.5px] text-sub">{fechaLabel}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
