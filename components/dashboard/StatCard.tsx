"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function pct(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

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

export interface StatCardProps {
  icon: React.ElementType;
  iconBg: string;
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

export function StatCard({
  icon: Icon, iconBg, iconColor, label, value, sub,
  trend, sparkline, sparkColor, barPct, barColor, href,
}: StatCardProps) {
  const inner = (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors h-full sm:gap-3 sm:p-4">
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

      <div>
        <div className="text-[22px] font-bold leading-none text-text sm:text-[28px]">{value}</div>
        {sub && <div className="mt-[5px] text-[11px] text-muted sm:text-[11.5px]">{sub}</div>}
      </div>

      {sparkline && sparkColor && <Sparkline data={sparkline} color={sparkColor} />}

      {barPct !== undefined && barColor && <Bar pct={barPct} color={barColor} />}
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
