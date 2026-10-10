"use client";

import Link from "next/link";
import { Scale, Users, AlertTriangle, Calendar, Banknote, FilePlus, WifiOff } from "lucide-react";
import { formatCurrency, formatDate, getDaysUntil, todayISO } from "@/utils/formatters";
import { getDeadlineLabel, getUrgency, URGENCY_TEXT } from "@/utils/urgencyHelpers";
import type { AlertaItem } from "@/services/supabase/layoutCounts";
import type { DashboardStats } from "@/services/supabase/dashboardStats";
import type { Evento } from "@/types";
import { pct, StatCard, type StatCardProps } from "./StatCard";
import { MiniCalendar } from "./MiniCalendar";
import MaintenanceBanner from "@/components/ui/MaintenanceBanner";

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

interface Props {
  nombre: string;
  causasActivas: number;
  alertas: AlertaItem[];
  eventos: (Evento & { caratula: string })[];
  stats: DashboardStats | null;
}

export default function DashboardView({ nombre, causasActivas, alertas, eventos, stats }: Props) {
  const hoy = todayISO();

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
      iconColor: "var(--color-cyan, #06b6d4)",
      label: "Audiencias",
      value: stats ? stats.audienciasProx30 : "—",
      sub: stats ? "próximas 30 días" : undefined,
      barPct: stats && stats.audienciasProx30 > 0 ? Math.min(100, stats.audienciasProx30 * 20) : 0,
      barColor: "var(--color-cyan, #06b6d4)",
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
      <MaintenanceBanner compact />

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
            {alertas.filter(a => (getDaysUntil(a.fecha) ?? -1) >= 0).length === 0 ? (
              <p className="px-4 py-5 text-[13.5px] text-muted">Sin vencimientos en los próximos 30 días.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {alertas.filter(a => (getDaysUntil(a.fecha) ?? -1) >= 0).slice(0, 6).map(a => {
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
