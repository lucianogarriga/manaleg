"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Scale, Users, AlertTriangle, Calendar, Banknote, FilePlus,
  TrendingUp, TrendingDown, Minus,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { addDaysISO, formatCurrency, formatDate, getDaysUntil, todayISO } from "@/utils/formatters";
import { getDeadlineLabel, getUrgency, URGENCY_TEXT } from "@/utils/urgencyHelpers";
import type { AlertaItem } from "@/services/supabase/layoutCounts";
import { WifiOff } from "lucide-react";
import type { DashboardStats } from "@/services/supabase/dashboardStats";
import type { Evento } from "@/types";

/* ─── helpers ─── */
function pct(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

/* ─── Sparkline (6 barras semanales) ─── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-[28px]">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-[6px] rounded-sm transition-all"
          style={{
            height: `${Math.max(15, Math.round((v / max) * 100))}%`,
            background: color,
            opacity: 0.25 + (i / data.length) * 0.75,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Trend badge ─── */
function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[11px] text-muted">—</span>;
  const up = value >= 0;
  const Icon = value === 0 ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`flex items-center gap-[3px] text-[12px] font-bold ${
        value === 0 ? "text-muted" : up ? "text-grn" : "text-red"
      }`}
    >
      <Icon size={12} strokeWidth={2.5} />
      {value === 0 ? "=" : `${up ? "+" : ""}${value}%`}
    </span>
  );
}

/* ─── Progress bar ─── */
function Bar({ pct: p, color }: { pct: number; color: string }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, p))}%`, background: color }}
      />
    </div>
  );
}

/* ─── StatCard ─── */
interface StatCardProps {
  icon: React.ElementType;
  iconBg: string;   // CSS color string for icon box background
  iconColor: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number | null;
  sparkline?: number[];
  sparkColor?: string;
  barPct?: number;
  barColor?: string;
  href?: string;
}

function StatCard({
  icon: Icon, iconBg, iconColor, label, value, sub,
  trend, sparkline, sparkColor, barPct, barColor, href,
}: StatCardProps) {
  const inner = (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors h-full sm:gap-3 sm:p-4">
      {/* Top row: icon + label + trend */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-[9px] min-w-0">
          <div
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px]"
            style={{ background: iconBg }}
          >
            <Icon size={15} strokeWidth={2} style={{ color: iconColor }} />
          </div>
          <span className="text-[10.5px] font-bold uppercase tracking-[.6px] text-muted leading-tight">
            {label}
          </span>
        </div>
        {trend !== undefined && <span className="hidden sm:block"><Trend value={trend ?? null} /></span>}
      </div>

      {/* Number */}
      <div>
        <div className="text-[22px] font-bold leading-none text-text sm:text-[28px]">{value}</div>
        {sub && <div className="mt-[5px] text-[11px] text-muted sm:text-[11.5px]">{sub}</div>}
      </div>

      {/* Bar bottom */}
      {barPct !== undefined && barColor && (
        <Bar pct={barPct} color={barColor} />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full" style={{ textDecoration: "none" }}
        onMouseEnter={(e) => { (e.currentTarget.firstChild as HTMLElement).style.background = "var(--hover-row)"; }}
        onMouseLeave={(e) => { (e.currentTarget.firstChild as HTMLElement).style.background = "var(--color-card)"; }}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

/* ─── Mini Calendar ─── */
const DIAS_SHORT = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function MiniCalendar({ alertas, eventos }: { alertas: AlertaItem[]; eventos: (Evento & { caratula: string })[] }) {
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
        <button type="button" onClick={() => setOffset(v => v - 1)} className="cursor-pointer rounded p-[3px] text-sub"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}>
          <ChevronLeft size={14} />
        </button>
        <span className="text-[13px] font-bold text-text">{MESES[month]} {year}</span>
        <button type="button" onClick={() => setOffset(v => v + 1)} className="cursor-pointer rounded p-[3px] text-sub"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}>
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

/* ─── Banner de error de stats ─── */
function StatsBanner() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-amb-lt bg-amb-lt px-4 py-3">
      <WifiOff size={15} className="shrink-0 text-amb" />
      <p className="text-[12.5px] text-amb">
        Las estadísticas no pudieron cargarse en este momento. Puede ser una demora temporal del servidor.
        <button
          type="button"
          className="ml-2 font-semibold underline"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </p>
    </div>
  );
}

/* ─── Main ─── */
interface Props {
  nombre: string;
  causasActivas: number;
  alertas: AlertaItem[];
  eventos: (Evento & { caratula: string })[];
  stats: DashboardStats | null;
}

export default function DashboardView({ nombre, causasActivas, alertas, eventos, stats }: Props) {
  const hoy = todayISO();
  const semana = addDaysISO(hoy, 7); // usado por MiniCalendar vía alertas/eventos

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const primerNombre = nombre.split(" ")[0];

  const trendCausas     = stats ? pct(stats.causasNuevasEste30, stats.causasNuevasPrev30) : null;
  const trendClientes   = stats ? pct(stats.clientesNuevosEste30, stats.clientesNuevosPrev30) : null;
  const trendHonorarios = stats ? pct(stats.honorariosCobradosEste30, stats.honorariosCobradosPrev30) : null;
  const barVenc         = stats && causasActivas > 0 ? Math.round((stats.vencimientosProx7 / causasActivas) * 100) : 0;

  const CARDS: StatCardProps[] = [
    {
      icon: Scale,
      iconBg: "rgba(37,99,235,.15)",
      iconColor: "var(--color-blue)",
      label: "Causas activas",
      value: stats ? stats.causasActivas : "—",
      sub: stats ? `${stats.causasNuevasEste30} nuevas este mes` : undefined,
      trend: trendCausas,
      href: "/causas",
    },
    {
      icon: FilePlus,
      iconBg: "rgba(4,120,87,.15)",
      iconColor: "var(--color-grn)",
      label: "Causas nuevas",
      value: stats ? stats.causasNuevasEste30 : "—",
      sub: stats ? "últimos 30 días" : undefined,
      trend: trendCausas,
      barPct: stats && trendCausas !== null && trendCausas > 0 ? Math.min(100, trendCausas) : 0,
      barColor: "var(--color-grn)",
      href: "/causas",
    },
    {
      icon: Users,
      iconBg: "rgba(91,33,182,.15)",
      iconColor: "var(--color-pur)",
      label: "Clientes",
      value: stats ? stats.clientesTotal : "—",
      sub: stats ? `${stats.clientesNuevosEste30} nuevos este mes` : undefined,
      trend: trendClientes,
      href: "/clientes",
    },
    {
      icon: AlertTriangle,
      iconBg: "rgba(180,83,9,.15)",
      iconColor: "var(--color-amb)",
      label: "Vencimientos próx.",
      value: stats ? stats.vencimientosProx7 : "—",
      sub: stats
        ? (stats.vencidosTotal > 0 ? `${stats.vencidosTotal} vencido${stats.vencidosTotal > 1 ? "s" : ""}` : "próximos 7 días")
        : undefined,
      barPct: barVenc,
      barColor: stats && stats.vencidosTotal > 0 ? "var(--color-red)" : "var(--color-amb)",
      href: "/vencimientos",
    },
    {
      icon: Calendar,
      iconBg: "rgba(6,182,212,.15)",
      iconColor: "#06b6d4",
      label: "Audiencias",
      value: stats ? stats.audienciasProx30 : "—",
      sub: stats ? "próximas 30 días" : undefined,
      barPct: stats && stats.audienciasProx30 > 0 ? Math.min(100, stats.audienciasProx30 * 20) : 0,
      barColor: "#06b6d4",
      href: "/causas",
    },
    {
      icon: Banknote,
      iconBg: "rgba(4,120,87,.15)",
      iconColor: "var(--color-grn)",
      label: "Honorarios cobrados",
      value: stats ? formatCurrency(stats.honorariosCobradosEste30) : "—",
      sub: stats ? "últimos 30 días" : undefined,
      trend: trendHonorarios,
      barPct: stats && trendHonorarios !== null && trendHonorarios > 0 ? Math.min(100, trendHonorarios) : 0,
      barColor: "var(--color-grn)",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-20 md:px-6 md:pb-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-text">{saludo}, {primerNombre}</h1>
        <p className="mt-[2px] text-[13.5px] text-sub">{formatDate(hoy)} · Resumen de tu actividad</p>
      </div>

      {/* Banner de error si stats es null */}
      {!stats && <StatsBanner />}

      {/* Stat cards — 3 col desktop, 2 col mobile */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Layout principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-full sm:w-[290px] sm:shrink-0">
          <MiniCalendar alertas={alertas} eventos={eventos} />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          {/* Próximos vencimientos */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-[11px]">
              <span className="text-[12px] font-bold uppercase tracking-[.5px] text-sub">Vencimientos próximos</span>
              <Link href="/vencimientos" className="text-[12px] font-semibold text-blue hover:underline">Ver todos</Link>
            </div>
            {alertas.length === 0 ? (
              <p className="px-4 py-5 text-[13.5px] text-muted">Sin vencimientos en los próximos 30 días.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {alertas.slice(0, 6).map(a => {
                  const urgency = getUrgency(a.fecha);
                  return (
                    <li key={a.causaId} className="flex items-start gap-3 px-4 py-[10px]">
                      <span className={`mt-[3px] shrink-0 text-[11px] font-semibold ${URGENCY_TEXT[urgency]}`}>
                        {getDeadlineLabel(a.fecha, a.tipo)}
                      </span>
                      <div className="min-w-0 flex-1 text-right">
                        <p className="truncate text-[13px] text-text">{a.caratula}</p>
                        {a.motivo && <p className="truncate text-[11.5px] text-muted">{a.motivo}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-[11px]">
              <span className="text-[12px] font-bold uppercase tracking-[.5px] text-sub">Próximos eventos</span>
              <Link href="/causas" className="text-[12px] font-semibold text-blue hover:underline">Ver causas</Link>
            </div>
            {eventos.length === 0 ? (
              <p className="px-4 py-5 text-[13.5px] text-muted">Sin eventos en los próximos 30 días.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {eventos.slice(0, 6).map(e => {
                  const dias = getDaysUntil(e.fecha);
                  const fechaLabel = dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : formatDate(e.fecha);
                  const TIPO_BADGE: Record<string, { bg: string; text: string }> = {
                    Audiencia: { bg: "bg-blue-lt", text: "text-blue" },
                    Mediación: { bg: "bg-pur-lt", text: "text-pur" },
                    Pericial:  { bg: "bg-amb-lt", text: "text-amb" },
                    Reunión:   { bg: "bg-grn-lt", text: "text-grn" },
                    Otro:      { bg: "bg-border",  text: "text-sub" },
                  };
                  const style = TIPO_BADGE[e.tipo] ?? TIPO_BADGE.Otro;
                  return (
                    <li key={e.id} className="flex items-start gap-3 px-4 py-[10px]">
                      <span className={`mt-[1px] shrink-0 rounded-[4px] px-[6px] py-[2px] text-[10px] font-semibold ${style.bg} ${style.text}`}>{e.tipo}</span>
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
