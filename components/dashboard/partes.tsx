// Piezas visuales del dashboard (Novedades y KPIs). Solo usan tokens de color de la paleta.
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { formatCurrency } from "@/utils/formatters";
import type { Dinero, Moneda } from "@/services/supabase/novedades";

export const MONEDAS: Moneda[] = ["ARS", "USD"];

// Número entero con separador de miles, como en el resto de la app.
export const numero = (n: number) => Math.round(n).toLocaleString("es-AR");

// Porcentaje de variación: null cuando no hay base de comparación.
export function variacion(actual: number, previo: number): number | null {
  if (previo === 0) return actual > 0 ? 100 : null;
  return Math.round(((actual - previo) / previo) * 100);
}

export function textoVariacion(actual: number, previo: number): string {
  const v = variacion(actual, previo);
  const diff = actual - previo;
  if (v === null) return "sin base previa";
  const signo = diff > 0 ? "+" : "";
  return `${signo}${diff} · ${v > 0 ? "+" : ""}${v}%`;
}

// Dinero por moneda, cada una en su línea (nunca se suman pesos con dólares).
export function Montos({ valores, vacio = "$ 0" }: { valores: Dinero; vacio?: string }) {
  const filas = MONEDAS.filter((m) => (valores[m] ?? 0) !== 0);
  if (filas.length === 0) return <>{vacio}</>;
  return (
    <>
      {filas.map((m) => (
        <span key={m} className="block">{formatCurrency(valores[m] ?? 0, m)}</span>
      ))}
    </>
  );
}

export function Card({ children, className = "", warn = false, style }: {
  children: ReactNode; className?: string; warn?: boolean; style?: CSSProperties;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-border bg-card px-[18px] py-4 ${className}`}
      style={{
        ...(warn
          ? {
              borderLeft: "3px solid color-mix(in srgb, var(--color-amb) 55%, transparent)",
              background: "color-mix(in srgb, var(--color-amb) 5%, var(--color-card))",
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Titulo({ children, sub, derecha }: { children: ReactNode; sub?: ReactNode; derecha?: ReactNode }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-text">{children}</div>
        {sub && <div className="mt-0.5 text-[12px] text-muted">{sub}</div>}
      </div>
      {derecha && <div className="shrink-0">{derecha}</div>}
    </div>
  );
}

export function SeccionEncabezado({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-muted">
      {children}
      {sub && <span className="font-normal normal-case tracking-normal">{sub}</span>}
    </div>
  );
}

export type Tono = "up" | "warn" | "bad" | "nil";

export function Badge({ tono, children }: { tono: Tono; children: ReactNode }) {
  const estilo: Record<Tono, string> = {
    up: "bg-blue-lt text-blue",
    warn: "bg-amb-lt text-amb",
    bad: "bg-red-lt text-red",
    nil: "bg-border text-muted",
  };
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-[2px] text-[11px] font-semibold ${estilo[tono]}`}>
      {children}
    </span>
  );
}

// Badge pequeño de la fila de "hoy": borde gris, rojo solo si el valor es mayor a 0.
export function BadgeHoy({ etiqueta, valor, rojo = false, href }: { etiqueta: string; valor: number; rojo?: boolean; href?: string }) {
  const alerta = rojo && valor > 0;
  const clase = `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[12px] text-muted ${
    alerta ? "border-red" : "border-border"
  } ${href ? "transition-colors hover:border-blue hover:text-text" : ""}`;
  const contenido = (
    <>
      {etiqueta}
      <b className={`tabular-nums ${alerta ? "text-red" : "text-text"}`}>{valor}</b>
    </>
  );
  return href ? <Link href={href} className={clase}>{contenido}</Link> : <span className={clase}>{contenido}</span>;
}

// Barras de tendencia de las últimas 7 semanas (la última resaltada).
export function Tendencia({ serie }: { serie: number[] }) {
  const max = Math.max(...serie, 1);
  return (
    <div className="flex h-[52px] shrink-0 items-end gap-[6px]" aria-hidden>
      {serie.map((v, i) => {
        const ultima = i === serie.length - 1;
        return (
          <span
            key={i}
            className="w-[12px] rounded-[4px]"
            style={{
              height: `${Math.max(10, (v / max) * 100)}%`,
              background: ultima ? "var(--color-blue)" : "var(--color-gray)",
              opacity: ultima ? 1 : 0.45,
            }}
          />
        );
      })}
    </div>
  );
}

// Tarjeta KPI: título, número, subtítulo, badge y tendencia de fondo.
export function KpiCard({ titulo, valor, sub, badge, alerta = false, grisada = false, serie, onClick }: {
  titulo: string;
  valor: ReactNode;
  sub?: ReactNode;
  badge?: ReactNode;
  alerta?: boolean;
  grisada?: boolean;
  serie?: number[];
  onClick?: () => void;
}) {
  return (
    <Card warn={alerta && !grisada} className={`${grisada ? "opacity-60" : "transition-colors hover:border-blue"} ${onClick ? "cursor-pointer" : ""}`}>
      <div onClick={onClick} className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 text-[16px] font-semibold leading-tight text-text">{titulo}</div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[22px] font-bold leading-tight tabular-nums text-text">{valor}</div>
            {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
          </div>
          {serie && serie.length > 0 && <Tendencia serie={serie} />}
        </div>
      </div>
    </Card>
  );
}

// Mosaico pequeño (KPIs y móvil).
export function Tile({ titulo, sub, valor, extra, grisada = false, className = "" }: {
  titulo: string; sub?: ReactNode; valor: ReactNode; extra?: ReactNode; grisada?: boolean; className?: string;
}) {
  return (
    <Card className={`${grisada ? "opacity-60" : ""} ${className}`}>
      <div className="text-[14px] font-semibold text-text">{titulo}</div>
      {grisada && <span className="text-[11px] text-muted">Próximamente</span>}
      <div className="mt-1 text-[20px] font-bold tabular-nums text-text">{valor}</div>
      {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
      {extra}
    </Card>
  );
}

export function BarraProgreso({ pct }: { pct: number }) {
  return (
    <div className="mt-3 h-[8px] w-full overflow-hidden rounded-full bg-panel2">
      <div className="h-full rounded-full bg-blue" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

// Barras horizontales (fueros, etapas, cumplimiento por tipo, facturación).
export function BarrasH({ filas, formato = (n: number) => String(n) }: {
  filas: { etiqueta: string; valor: number }[];
  formato?: (n: number) => string;
}) {
  if (filas.length === 0) return <p className="text-[12px] text-muted">Sin datos todavía.</p>;
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <div className="flex flex-col gap-2">
      {filas.map((f) => (
        <div key={f.etiqueta} className="grid grid-cols-[minmax(0,120px)_1fr_auto] items-center gap-2 text-[12px]">
          <span className="truncate text-muted">{f.etiqueta}</span>
          <div className="h-[9px] overflow-hidden rounded-[5px] bg-panel2">
            <div className="h-full rounded-[5px] bg-blue" style={{ width: `${(f.valor / max) * 100}%` }} />
          </div>
          <span className="whitespace-nowrap text-right font-semibold tabular-nums text-text">{formato(f.valor)}</span>
        </div>
      ))}
    </div>
  );
}

// Dona de estados de causas.
export function Dona({ segmentos, sinLeyenda = false }: { segmentos: { etiqueta: string; valor: number; color: string }[]; sinLeyenda?: boolean }) {
  const total = segmentos.reduce((a, s) => a + s.valor, 0);
  const r = 52, ri = 42, c = 60;
  let angulo = -Math.PI / 2;
  const punto = (radio: number, a: number) => [c + radio * Math.cos(a), c + radio * Math.sin(a)];
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Estado de causas" className="shrink-0">
        {total === 0 && (
          <circle cx={c} cy={c} r={(r + ri) / 2} fill="none" strokeWidth={r - ri} style={{ stroke: "var(--color-panel2)" }} />
        )}
        {total > 0 && segmentos.map((s) => {
          if (s.valor === 0) return null;
          const a0 = angulo;
          const delta = (s.valor / total) * 2 * Math.PI;
          const a1 = a0 + delta;
          angulo = a1;
          // SVG can't draw a 360° arc as a single command — split into two semicircles
          if (delta >= 2 * Math.PI - 0.001) {
            const [x0, y0] = punto(r, a0), [xh, yh] = punto(r, a0 + Math.PI);
            const [xi0, yi0] = punto(ri, a0), [xih, yih] = punto(ri, a0 + Math.PI);
            const d = `M${x0},${y0} A${r},${r} 0 1 1 ${xh},${yh} A${r},${r} 0 1 1 ${x0},${y0} L${xi0},${yi0} A${ri},${ri} 0 1 0 ${xih},${yih} A${ri},${ri} 0 1 0 ${xi0},${yi0} Z`;
            return <path key={s.etiqueta} d={d} style={{ fill: s.color }} />;
          }
          const grande = delta > Math.PI ? 1 : 0;
          const [x0, y0] = punto(r, a0), [x1, y1] = punto(r, a1), [xi1, yi1] = punto(ri, a1), [xi0, yi0] = punto(ri, a0);
          const d = `M${x0},${y0} A${r},${r} 0 ${grande} 1 ${x1},${y1} L${xi1},${yi1} A${ri},${ri} 0 ${grande} 0 ${xi0},${yi0} Z`;
          return <path key={s.etiqueta} d={d} style={{ fill: s.color }} />;
        })}
        <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" style={{ fill: "var(--color-text)" }}>{total}</text>
        <text x="60" y="70" textAnchor="middle" fontSize="9" style={{ fill: "var(--color-muted)" }}>causas</text>
      </svg>
      {!sinLeyenda && <ul className="flex min-w-[160px] flex-1 flex-col gap-1 text-[13px]">
        {segmentos.map((s) => (
          <li key={s.etiqueta} className="flex items-center gap-2 border-b border-border py-1.5 last:border-0">
            <span className="flex flex-1 items-center gap-2 text-text">
              <span className="inline-block h-[9px] w-[9px] shrink-0 rounded-sm" style={{ background: s.color }} />
              {s.etiqueta}
            </span>
            <span className="flex items-center gap-3 tabular-nums">
              <b className="min-w-[18px] text-center text-text">{s.valor}</b>
              <span className="min-w-[30px] text-right text-[11px] text-muted">{total ? Math.round((s.valor / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>}
    </div>
  );
}

// Gráfico de barras agrupadas (cobrado / pendiente) por mes.
export function BarrasAgrupadas({ meses, cobrado, pendiente, moneda }: {
  meses: string[]; cobrado: number[]; pendiente: number[]; moneda: Moneda;
}) {
  const vw = 600, vh = 200, pl = 44, pb = 22, pt = 8, pr = 4;
  const iw = vw - pl - pr, ih = vh - pb - pt;
  const max = Math.max(...cobrado, ...pendiente, 1) * 1.15;
  const y = (v: number) => pt + ih - (v / max) * ih;
  const slot = iw / meses.length, bw = slot * 0.3, gp = 3;
  const marcas = [0, 0.33, 0.66, 1].map((k) => max * k);
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" role="img" aria-label="Honorarios cobrados y pendientes por mes">
      {marcas.map((v) => (
        <g key={v}>
          <line x1={pl} x2={vw - pr} y1={y(v)} y2={y(v)} style={{ stroke: "var(--color-border)" }} />
          <text x={pl - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" style={{ fill: "var(--color-muted)" }}>
            {formatCurrency(Math.round(v), moneda)}
          </text>
        </g>
      ))}
      {meses.map((m, i) => {
        const x0 = pl + i * slot + (slot - (2 * bw + gp)) / 2;
        const ultimo = i === meses.length - 1;
        return (
          <g key={m}>
            <rect x={x0} y={y(cobrado[i])} width={bw} height={pt + ih - y(cobrado[i])} rx="3" style={{ fill: "var(--color-blue)" }} />
            <rect x={x0 + bw + gp} y={y(pendiente[i])} width={bw} height={pt + ih - y(pendiente[i])} rx="3" style={{ fill: "var(--color-pur)" }} />
            <text x={x0 + bw / 2} y={y(cobrado[i]) - 4} textAnchor="middle" fontSize="9" style={{ fill: "var(--color-muted)" }}>{cobrado[i] ? numero(cobrado[i]) : ""}</text>
            <text x={x0 + bw + gp + bw / 2} y={y(pendiente[i]) - 4} textAnchor="middle" fontSize="9" style={{ fill: "var(--color-muted)" }}>{pendiente[i] ? numero(pendiente[i]) : ""}</text>
            <text x={x0 + bw + gp / 2} y={vh - 6} textAnchor="middle" fontSize="10"
              style={{ fill: ultimo ? "var(--color-text)" : "var(--color-muted)" }} fontWeight={ultimo ? 700 : 400}>{m}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Gráfico de ondas: dos líneas suaves, con el mismo dato que las barras.
export function Ondas({ meses, series, moneda, formato }: {
  meses: string[];
  series: { valores: number[]; color: string; posicion: "arriba" | "abajo" }[];
  moneda?: Moneda;
  formato?: (n: number) => string;
}) {
  const vw = 600, vh = 200, pl = 44, pb = 22, pt = 8, pr = 4;
  const iw = vw - pl - pr, ih = vh - pb - pt;
  const max = Math.max(...series.flatMap((s) => s.valores), 1) * 1.15;
  const slot = iw / meses.length;
  const X = (i: number) => pl + i * slot + slot / 2;
  const Y = (v: number) => pt + ih - (v / max) * ih;
  const fmt = formato ?? ((n: number) => formatCurrency(Math.round(n), moneda ?? "ARS"));
  const marcas = [0, 1, 2, 3].map((k) => (max * k) / 3);
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" role="img" aria-label="Gráfico de ondas">
      {marcas.map((v) => (
        <g key={v}>
          <line x1={pl} x2={vw - pr} y1={Y(v)} y2={Y(v)} style={{ stroke: "var(--color-border)" }} />
          <text x={pl - 6} y={Y(v) + 3.5} textAnchor="end" fontSize="10" style={{ fill: "var(--color-muted)" }}>{fmt(v)}</text>
        </g>
      ))}
      {series.map((s, k) => {
        const pts = s.valores.map((v, i) => [X(i), Y(v)] as const);
        let d = pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dx = (x1 - x0) / 2;
          d += ` C${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`;
        }
        const dy = s.posicion === "abajo" ? 13 : -7;
        return (
          <g key={k}>
            <path d={d} fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" opacity=".85" style={{ stroke: s.color }} />
            {pts.map(([px, py], i) => (
              <g key={i}>
                <circle cx={px} cy={py} r="2.5" style={{ fill: s.color }} />
                <text x={px} y={py + dy} textAnchor="middle" fontSize="9" style={{ fill: "var(--color-muted)" }}>{s.valores[i] ? numero(s.valores[i]) : ""}</text>
              </g>
            ))}
          </g>
        );
      })}
      {meses.map((m, i) => {
        const ultimo = i === meses.length - 1;
        return (
          <text key={m} x={X(i)} y={vh - 6} textAnchor="middle" fontSize="10"
            style={{ fill: ultimo ? "var(--color-text)" : "var(--color-muted)" }} fontWeight={ultimo ? 700 : 400}>{m}</text>
        );
      })}
    </svg>
  );
}

// Barras verticales simples (causas nuevas por mes).
export function BarrasVerticales({ meses, valores }: { meses: string[]; valores: number[] }) {
  const vw = 600, vh = 160, pt = 16, pb = 22;
  const ih = vh - pt - pb;
  const max = Math.max(...valores, 1) * 1.15;
  const slot = vw / meses.length, bw = slot * 0.5;
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" role="img" aria-label="Causas nuevas por mes">
      {meses.map((m, i) => {
        const h = (valores[i] / max) * ih;
        const x = i * slot + (slot - bw) / 2;
        const ultimo = i === meses.length - 1;
        return (
          <g key={m}>
            <rect x={x} y={pt + ih - h} width={bw} height={h} rx="3" style={{ fill: ultimo ? "var(--color-pur)" : "var(--color-blue)" }} />
            <text x={x + bw / 2} y={pt + ih - h - 5} textAnchor="middle" fontSize="11" fontWeight="600" style={{ fill: "var(--color-text)" }}>{valores[i]}</text>
            <text x={x + bw / 2} y={vh - 6} textAnchor="middle" fontSize="10"
              style={{ fill: ultimo ? "var(--color-text)" : "var(--color-muted)" }}>{m}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Interruptor de dos o tres opciones.
export function Segmentado<T extends string>({ valores, actual, onChange, etiquetas, deshabilitados = [], titulo, small = false }: {
  valores: readonly T[];
  actual: T;
  onChange: (v: T) => void;
  etiquetas: Record<T, string>;
  deshabilitados?: readonly T[];
  titulo?: string;
  small?: boolean;
}) {
  return (
    <div role="group" aria-label={titulo} className={`inline-flex overflow-hidden border border-border bg-card ${small ? "rounded-[8px]" : "rounded-[10px]"}`}>
      {valores.map((v) => {
        const activo = v === actual;
        const off = deshabilitados.includes(v);
        return (
          <button
            key={v}
            type="button"
            disabled={off}
            aria-pressed={activo}
            title={off ? "Próximamente" : undefined}
            onClick={() => onChange(v)}
            className={`whitespace-nowrap transition-colors ${small ? "px-2.5 py-[5px] text-[11.5px]" : "px-3 py-[7px] text-[13px]"} ${
              activo ? "bg-blue font-semibold text-on-primary" : off ? "cursor-not-allowed text-muted opacity-50" : "text-sub hover:text-text"
            }`}
          >
            {etiquetas[v]}
          </button>
        );
      })}
    </div>
  );
}

// Calendario mensual: puntos por tipo de evento.
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function Calendario({ anio, mes, dias, hoy }: {
  anio: number; mes: number; dias: { fecha: string; audiencias: number; vencimientos: number; vencidos: number; tareas: number; detalle: string[] }[]; hoy: string;
}) {
  const primero = new Date(Date.UTC(anio, mes - 1, 1));
  const cantidad = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const offset = (primero.getUTCDay() + 6) % 7; // semana desde lunes
  const porDia = new Map(dias.map((d) => [Number(d.fecha.slice(8, 10)), d]));
  const celdas: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: cantidad }, (_, i) => i + 1)];
  const esHoy = (n: number) => `${anio}-${String(mes).padStart(2, "0")}-${String(n).padStart(2, "0")}` === hoy;
  return (
    <div>
      <div className="grid grid-cols-7 gap-[3px] text-center text-[11px]">
        {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
          <div key={`${d}${i}`} className="py-1 font-semibold text-muted">{d}</div>
        ))}
        {celdas.map((n, i) => {
          if (n === null) return <div key={`v${i}`} />;
          const d = porDia.get(n);
          return (
            <div key={n} className={`group relative rounded-md py-1.5 ${esHoy(n) ? "bg-blue font-bold text-on-primary" : ""}`}>
              {n}
              {d && d.detalle.length > 0 && (
                <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 hidden w-[240px] -translate-x-1/2 rounded-[8px] border border-border bg-card p-2.5 text-left text-[12px] font-normal text-sub shadow-[0_8px_24px_rgba(0,0,0,.18)] group-hover:block">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[.4px] text-muted">{n} de {MESES_CORTOS[mes - 1]}</div>
                  {d.detalle.slice(0, 6).map((linea, i) => (
                    <div key={i} className="truncate py-[2px]">{linea}</div>
                  ))}
                  {d.detalle.length > 6 && <div className="pt-1 text-muted">+{d.detalle.length - 6} más</div>}
                </div>
              )}
              <div className="absolute bottom-[2px] left-1/2 flex -translate-x-1/2 gap-[2px]">
                {d && d.audiencias > 0 && <span className="h-1 w-1 rounded-full bg-cel" />}
                {d && d.vencimientos > 0 && <span className="h-1 w-1 rounded-full bg-amb" />}
                {d && d.vencidos > 0 && <span className="h-1 w-1 rounded-full bg-red" />}
                {d && d.tareas > 0 && <span className="h-1 w-1 rounded-full bg-blue" />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cel" />Audiencia</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amb" />Vencimiento</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red" />Vencido</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue" />Tarea</span>
      </div>
    </div>
  );
}

// Etiqueta de urgencia de un plazo.
export function EtiquetaPlazo({ fecha, hoy }: { fecha: string; hoy: string }) {
  if (fecha < hoy) return <span className="rounded px-1.5 py-[1px] text-[10px] font-bold tracking-wide text-red" style={{ border: "1px solid color-mix(in srgb, var(--color-red) 45%, transparent)" }}>VENCIDO</span>;
  const dias = Math.round((Date.parse(fecha) - Date.parse(hoy)) / 86400000);
  if (dias <= 3) return <span className="rounded px-1.5 py-[1px] text-[10px] font-bold tracking-wide text-amb" style={{ border: "1px solid color-mix(in srgb, var(--color-amb) 45%, transparent)" }}>URGENTE</span>;
  return <span className="rounded px-1.5 py-[1px] text-[10px] font-bold tracking-wide text-muted" style={{ border: "1px solid var(--color-border)" }}>PRÓX.</span>;
}

export function FilaLista({ titulo, meta, derecha, punto }: {
  titulo: ReactNode; meta?: ReactNode; derecha?: ReactNode; punto?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 border-b border-border py-2.5 last:border-0">
      {punto && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: punto }} />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-text">{titulo}</div>
        {meta && <div className="truncate text-[11px] text-muted">{meta}</div>}
      </div>
      {derecha && <div className="shrink-0 text-right text-[11px] text-muted">{derecha}</div>}
    </div>
  );
}
