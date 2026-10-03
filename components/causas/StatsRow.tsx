"use client";

import { getDaysUntil } from "@/utils/formatters";
import type { CausaConRelaciones } from "@/types";

interface StatCardProps {
  label: string;
  value: number;
  variant: "red" | "amb" | "navy" | "muted";
}

function StatCard({ label, value, variant }: StatCardProps) {
  const numColor: Record<StatCardProps["variant"], string> = {
    red:   "text-red",
    amb:   "text-amb",
    navy:  "text-blue",
    muted: "text-sub",
  };
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[8px] border border-border bg-card px-3 py-[10px]">
      <span className={`text-[24px] font-bold leading-none ${numColor[variant]}`}>{value}</span>
      <span className="mt-[4px] text-center text-[11px] font-medium text-sub leading-[1.3]">{label}</span>
    </div>
  );
}

export default function StatsRow({ causas }: { causas: CausaConRelaciones[] }) {
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
    const dias = -(getDaysUntil(ref) ?? 0);
    return dias >= 7;
  }).length;

  return (
    <div className="flex gap-[10px] px-[14px] pt-[14px] pb-[10px]">
      <StatCard label="Vencen hoy / vencidas" value={venceHoyOVencida} variant="red" />
      <StatCard label="Vencen en 3 días" value={venceEn3} variant="amb" />
      <StatCard label="Sin movimiento +7d" value={sinMovimiento} variant="muted" />
      <StatCard label="Causas activas" value={activas.length} variant="navy" />
    </div>
  );
}
