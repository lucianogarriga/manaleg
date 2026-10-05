"use client";

import { getDaysUntil } from "@/utils/formatters";
import { useCausasStore, type CausasFilter } from "@/store/causasStore";
import type { CausaConRelaciones } from "@/types";

interface StatCardProps {
  label: string;
  value: number;
  variant: "red" | "amb" | "navy" | "muted";
  filter: CausasFilter;
  active: boolean;
  onClick: () => void;
}

function StatCard({ label, value, variant, active, onClick }: StatCardProps) {
  const numColor: Record<StatCardProps["variant"], string> = {
    red:   "text-red",
    amb:   "text-amb",
    navy:  "text-blue",
    muted: "text-sub",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-[8px] border px-3 py-[10px] transition-colors"
      style={{
        background: active ? "var(--hover-row)" : "var(--color-card)",
        borderColor: active ? "var(--color-blue)" : "var(--color-border)",
        outline: active ? "1.5px solid var(--color-blue)" : "none",
      }}
    >
      <span className={`text-[24px] font-bold leading-none ${numColor[variant]}`}>{value}</span>
      <span className="mt-[4px] text-center text-[11px] font-medium text-sub leading-[1.3]">{label}</span>
    </button>
  );
}

export default function StatsRow({ causas }: { causas: CausaConRelaciones[] }) {
  const filter = useCausasStore((s) => s.filter);
  const setFilter = useCausasStore((s) => s.setFilter);

  const activas = causas.filter((c) => c.estado !== "Cerrada");

  const venceHoyOVencida = activas.filter((c) => {
    if (!c.proximo_vencimiento) return false;
    return (getDaysUntil(c.proximo_vencimiento) ?? Infinity) <= 1;
  }).length;

  const venceEn3 = activas.filter((c) => {
    if (!c.proximo_vencimiento) return false;
    const d = getDaysUntil(c.proximo_vencimiento) ?? Infinity;
    return d > 1 && d <= 3;
  }).length;

  const sinMovimiento = activas.filter((c) => {
    const ref = c.fecha_ultimo_movimiento ?? c.created_at.slice(0, 10);
    return -(getDaysUntil(ref) ?? 0) >= 7;
  }).length;

  const toggle = (f: CausasFilter) => setFilter(filter === f ? "todas" : f);

  return (
    <div className="grid grid-cols-2 gap-[10px] px-[14px] pt-[14px] pb-[10px] sm:grid-cols-4">
      <StatCard label="Vencen hoy / vencidas" value={venceHoyOVencida} variant="red"   filter="vencen_hoy"      active={filter === "vencen_hoy"}      onClick={() => toggle("vencen_hoy")} />
      <StatCard label="Vencen en 3 días"       value={venceEn3}         variant="amb"   filter="vencen_3dias"    active={filter === "vencen_3dias"}    onClick={() => toggle("vencen_3dias")} />
      <StatCard label="Sin movimiento +7d"      value={sinMovimiento}    variant="muted" filter="sin_movimiento"  active={filter === "sin_movimiento"}  onClick={() => toggle("sin_movimiento")} />
      <StatCard label="Causas activas"          value={activas.length}   variant="navy"  filter="todas"           active={false}                        onClick={() => setFilter("todas")} />
    </div>
  );
}
