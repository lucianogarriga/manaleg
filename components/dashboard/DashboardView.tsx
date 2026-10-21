"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { recargarNovedades, guardarPreferenciaGraficos } from "@/app/(app)/novedadesActions";
import { toggleTodo } from "@/app/(app)/causas/todoActions";
import { formatCurrency, formatDate, todayISO } from "@/utils/formatters";
import { useAuthStore } from "@/store/authStore";
import ValorJusModal from "@/components/layout/ValorJusModal";
import type { Moneda, NovedadesCompletas, Periodo, Novedades } from "@/services/supabase/novedades";
import {
  Badge, BadgeHoy, BarraProgreso, BarrasAgrupadas, BarrasH, BarrasVerticales, Calendario, Card, Dona,
  EtiquetaPlazo, FilaLista, KpiCard, MONEDAS, Montos, Ondas, SeccionEncabezado, Segmentado, Tile, Titulo,
  variacion, type Tono,
} from "./partes";

const NOMBRE_MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const ABREV_MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function nombrePeriodo(periodo: Periodo, d: Novedades["periodo"]): { nombre: string; comparacion: string } {
  const [yh, mh] = d.hasta.split("-").map(Number);
  const md = Number(d.desde.split("-")[1]);
  const [yp, mp] = d.prevDesde.split("-").map(Number);
  if (periodo === "mes") {
    const prevNombre = NOMBRE_MES[(mp - 1 + 12) % 12];
    return { nombre: `${NOMBRE_MES[mh - 1][0].toUpperCase()}${NOMBRE_MES[mh - 1].slice(1)} ${yh}`, comparacion: `vs. ${prevNombre}` };
  }
  if (periodo === "trim") {
    return {
      nombre: `${ABREV_MES[md - 1]} – ${ABREV_MES[mh - 1]} ${yh}`,
      comparacion: `vs. ${ABREV_MES[mp - 1]} – ${ABREV_MES[(mp + 1) % 12]}`,
    };
  }
  return { nombre: `Ene – ${ABREV_MES[mh - 1]} ${yh}`, comparacion: `vs. mismo período ${yp}` };
}

const DUR_PERIODO: Record<Periodo, string> = { mes: "Mes", trim: "Trimestre", anio: "Año" };

function fechaCorta(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${ABREV_MES[m - 1].toLowerCase()}`;
}

// Badges de variación por moneda. soloPorc=true muestra solo el % (evita overflow en cards angostas).
function badgesVariacion(actual: Partial<Record<Moneda, number>>, previo: Partial<Record<Moneda, number>>, soloPorc = false) {
  return MONEDAS.filter((m) => (actual[m] ?? 0) > 0 || (previo[m] ?? 0) > 0).map((m) => {
    const a = actual[m] ?? 0, p = previo[m] ?? 0;
    const v = variacion(a, p);
    const tono: Tono = v === null ? "nil" : a >= p ? "up" : "warn";
    const flecha = a >= p ? "↑" : "▼";
    const texto = v === null ? "sin base previa"
      : soloPorc ? `${m} ${flecha} ${v > 0 ? "+" : ""}${v}%`
      : `${m} ${flecha} ${a - p >= 0 ? "+" : ""}${formatCurrency(a - p, m)} · ${v > 0 ? "+" : ""}${v}%`;
    return <Badge key={m} tono={tono}>{texto}</Badge>;
  });
}

interface Props {
  inicial: NovedadesCompletas | null;
  preferencia: "barras" | "ondas";
  nombre: string;
}

export default function DashboardView({ inicial, preferencia, nombre }: Props) {
  // Solo el primer nombre, nunca el apellido.
  const primerNombre = nombre.trim().split(/\s+/)[0] ?? "";
  const [tab, setTab] = useState<"novedades" | "kpis">("novedades");
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [datos, setDatos] = useState<NovedadesCompletas | null>(inicial);
  const [error, setError] = useState<string | null>(inicial ? null : "No pudimos cargar los indicadores.");
  const [cargando, startTransition] = useTransition();
  const [estilo, setEstilo] = useState<"barras" | "ondas">(preferencia);
  const [moneda, setMoneda] = useState<Moneda>("ARS");
  const [base, setBase] = useState<"activas" | "todas">("activas");
  const [tareas, setTareas] = useState(inicial?.tareas ?? []);

  const cambiarPeriodo = (p: Periodo) => {
    setPeriodo(p);
    startTransition(async () => {
      const res = await recargarNovedades(p);
      if ("error" in res) { setError(res.error); return; }
      setError(null);
      setDatos(res);
    });
  };

  const cambiarEstilo = (v: "barras" | "ondas") => {
    setEstilo(v);
    void guardarPreferenciaGraficos(v);
  };

  const marcarTarea = async (id: string, completado: boolean) => {
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, completado } : t)));
    const res = await toggleTodo(id, completado);
    if (res.error) setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, completado: !completado } : t)));
  };

  const hoy = todayISO();
  const jusValor = useAuthStore((s) => s.profile?.jus_valor ?? null);
  const jusRef = useAuthStore((s) => s.profile?.jus_referencia ?? null);
  const jusFecha = useAuthStore((s) => s.profile?.jus_valor_fecha ?? null);
  const [valorJusOpen, setValorJusOpen] = useState(false);
  const jusDias = jusFecha ? Math.floor((Date.parse(hoy) - Date.parse(jusFecha)) / 86400000) : null;

  return (
    <div className="flex flex-col gap-3 px-4 pb-6 md:px-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mt-0.5 text-[26px] font-semibold text-text">{primerNombre ? `Hola, ${primerNombre}` : "Hola"}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
        </div>
      </div>

      {/* ── Pestañas + período ── */}
      <div className="flex items-center gap-[18px] border-b border-border">
        {(["novedades", "kpis"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-0.5 py-2 text-[14px] transition-colors ${
              tab === t ? "border-accent font-semibold text-text" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {t === "novedades" ? "Novedades" : "KPIs"}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 pb-[6px]">
          <div className="group relative">
            <div className={`flex items-center gap-2 rounded-[8px] border px-2.5 py-[5px] text-[12px] ${
              jusDias !== null && jusDias > 60 ? "border-amb-bd bg-amb-lt text-amb" : "border-border bg-card text-sub"
            }`}>
              <button type="button" aria-label="¿Qué es la moneda judicial?"
                className="flex h-[16px] w-[16px] cursor-pointer items-center justify-center rounded-full border border-muted text-[10px] font-bold text-muted">
                i
              </button>
              <span className="font-semibold text-text">Moneda judicial</span>
              {jusValor != null ? (
                <span className="tabular-nums text-text">{jusRef ? `${jusRef}: ` : ""}{formatCurrency(jusValor, "ARS")}</span>
              ) : (
                <span className="text-muted">sin cargar</span>
              )}
              <button type="button" onClick={() => setValorJusOpen(true)}
                className="cursor-pointer font-semibold text-blue hover:underline">
                {jusValor != null ? "Modificar" : "Cargar"}
              </button>
            </div>
            <div className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-[260px] group-focus-within:block group-hover:block rounded-[8px] border border-border bg-card p-3 text-[12px] text-sub shadow-[0_8px_24px_rgba(0,0,0,.18)]">
                <p>Valor de referencia de uso judicial, con el que se expresan honorarios y montos.</p>
                <p className="mt-1.5 text-muted">Ejemplos: JUS de Córdoba, UMA de Buenos Aires.</p>
                {jusFecha && <p className="mt-1.5 text-muted">Actualizado {formatDate(jusFecha)}{jusDias !== null && jusDias > 60 ? " · conviene actualizarlo (más de 60 días)" : ""}</p>}
              </div>
          </div>
          <Segmentado
            titulo="Período"
            valores={["mes", "trim", "anio"] as Periodo[]}
            actual={periodo}
            onChange={cambiarPeriodo}
            etiquetas={{ mes: "Mes", trim: "Trim.", anio: "Año" }}
            small
          />
        </div>
      </div>

      {valorJusOpen && <ValorJusModal onClose={() => setValorJusOpen(false)} />}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amb-bd bg-amb-lt px-4 py-3 text-[13px] text-amb">
          <span>{error}</span>
          <button type="button" onClick={() => window.location.reload()} className="font-semibold underline">Reintentar</button>
        </div>
      )}

      {datos && (
        <div className={`flex flex-col gap-3 transition-opacity ${cargando ? "opacity-60" : ""}`} aria-busy={cargando}>
          {tab === "novedades"
            ? <Novedades d={datos} periodo={periodo} moneda={moneda} setMoneda={setMoneda} estilo={estilo} setEstilo={cambiarEstilo}
                tareas={tareas} marcarTarea={marcarTarea} hoy={hoy} />
            : <Kpis d={datos} periodo={periodo} moneda={moneda} setMoneda={setMoneda} estilo={estilo} setEstilo={cambiarEstilo}
                base={base} setBase={setBase} />}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Novedades ─────────────────────────

interface VistaProps {
  d: NovedadesCompletas;
  periodo: Periodo;
  moneda: Moneda;
  setMoneda: (m: Moneda) => void;
  estilo: "barras" | "ondas";
  setEstilo: (e: "barras" | "ondas") => void;
  hoy: string;
}

function Novedades({ d, periodo, moneda, setMoneda, estilo, setEstilo, tareas, marcarTarea, hoy }: VistaProps & {
  tareas: NovedadesCompletas["tareas"];
  marcarTarea: (id: string, completado: boolean) => void;
}) {
  const n = d.datos;
  const per = nombrePeriodo(periodo, n.periodo);
  const vencAll = n.vencimientos.vencidos + n.vencimientos.urgentes + n.vencimientos.proximos;
  const [anio, mes] = hoy.split("-").map(Number);
  const meses = n.financiero.seisMeses.map((s) => ABREV_MES[Number(s.mes.slice(5, 7)) - 1]);
  const cobrados = n.financiero.seisMeses.map((s) => s.cobrado[moneda] ?? 0);
  const pendientes = n.financiero.seisMeses.map((s) => s.pendiente[moneda] ?? 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard
          titulo="Causas activas"
          valor={n.causas.activas}
          sub={`${n.causas.judiciales} judiciales · ${n.causas.extrajudiciales} extrajudiciales`}
          serie={d.tendencias.causasActivas}
          badge={<Badge tono="up">+{n.causas.nuevasMes} nuevas este mes</Badge>}
        />
        <KpiCard
          titulo="Vencimientos"
          valor={vencAll}
          alerta={n.vencimientos.vencidos > 0}
          sub={`${n.vencimientos.vencidos} vencido · ${n.vencimientos.urgentes} urgente · ${n.vencimientos.proximos} próximo`}
          serie={d.tendencias.vencimientos}
          badge={n.vencimientos.vencidos > 0 ? <Badge tono="bad">{n.vencimientos.vencidos} vencido{n.vencimientos.vencidos > 1 ? "s" : ""}</Badge> : <Badge tono="nil">al día</Badge>}
        />
        <KpiCard
          titulo="Inactivas +30 días"
          valor={n.causas.inactivas30}
          alerta={n.causas.inactivas30 > 0}
          sub="Sin movimiento hace más de 30 días"
          serie={d.tendencias.inactivas}
          badge={<Badge tono={n.causas.inactivas30 > 0 ? "warn" : "nil"}>{n.causas.inactivas30 > 0 ? "revisar" : "al día"}</Badge>}
        />
      </div>

      <div className="mb-1 flex flex-wrap gap-2">
        <BadgeHoy etiqueta="Plazos vencidos" valor={n.vencimientos.vencidos} rojo />
        <BadgeHoy etiqueta="Plazos que vencen hoy" valor={n.vencimientos.hoy} />
        <BadgeHoy etiqueta="Audiencias hoy" valor={n.audiencias.hoy} />
        <BadgeHoy etiqueta="Tareas hoy" valor={n.tareas.hoy} />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard
          titulo="Honorarios cobrados"
          valor={<Montos valores={n.financiero.cobrado} />}
          sub={`${per.nombre} · ${per.comparacion}`}
          serie={d.tendencias.cobrado}
          badge={(() => { const bs = badgesVariacion(n.financiero.cobrado, n.financiero.cobradoPrev, true); return bs.length > 0 ? <div className="flex flex-col items-end gap-1">{bs}</div> : undefined; })()}
        />
        <KpiCard
          titulo={`Pendiente del ${DUR_PERIODO[periodo].toLowerCase()}`}
          valor={<Montos valores={n.financiero.pendientePeriodo} />}
          sub="Cobrado vs. facturado del período"
          serie={d.tendencias.pendientePeriodo}
        />
        <KpiCard
          titulo="Pendiente de cobro total"
          valor={<Montos valores={n.financiero.pendienteTotal} />}
          sub={`en ${n.financiero.pendienteCausasTotal} causas`}
          serie={d.tendencias.pendienteTotal}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
        <Card>
          <Titulo
            sub="Cobrado vs. pendiente · últimos 6 meses"
            derecha={
              <div className="flex flex-wrap justify-end gap-2">
                <Segmentado titulo="Moneda" valores={["ARS", "USD"] as Moneda[]} actual={moneda} onChange={setMoneda}
                  etiquetas={{ ARS: "$", USD: "US$" }} />
                <Segmentado titulo="Gráfico" valores={["barras", "ondas"] as const} actual={estilo} onChange={setEstilo}
                  etiquetas={{ barras: "Barras", ondas: "Ondas" }} />
              </div>
            }
          >
            Honorarios por mes
          </Titulo>
          {estilo === "barras"
            ? <BarrasAgrupadas meses={meses} cobrado={cobrados} pendiente={pendientes} moneda={moneda} />
            : <Ondas meses={meses} moneda={moneda} series={[
                { valores: cobrados, color: "var(--color-series-1)", posicion: "arriba" },
                { valores: pendientes, color: "var(--color-pur)", posicion: "abajo" },
              ]} />}
          <div className="mt-2 flex gap-4 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-blue" />Cobrado</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-pur" />Pendiente</span>
          </div>
        </Card>

        <Card>
          <Titulo sub={`${ABREV_MES[mes - 1]} ${anio}`}>Agenda</Titulo>
          <Calendario anio={anio} mes={mes} dias={d.calendario} hoy={hoy} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card warn={n.vencimientos.vencidos + n.vencimientos.urgentes > 0}>
          <Titulo derecha={<Badge tono={n.vencimientos.vencidos > 0 ? "bad" : "nil"}>{n.vencimientos.vencidos} vencido{n.vencimientos.vencidos === 1 ? "" : "s"}</Badge>}>Vencimientos</Titulo>
          <Lista>
            {d.vencimientos.length === 0 && <Vacio>Sin plazos en los próximos 7 días.</Vacio>}
            {d.vencimientos.map((v) => (
              <FilaLista key={v.id}
                titulo={v.motivo || v.tipo}
                meta={v.causa}
                derecha={<><EtiquetaPlazo fecha={v.fecha} hoy={hoy} /><div className="mt-1">{fechaCorta(v.fecha)}</div></>} />
            ))}
          </Lista>
          {d.vencimientosLejanos[0] && (
            <div className="mt-2 border-t border-border pt-2 text-[12px] text-muted">
              Fuera de los 7 días: {d.vencimientosLejanos[0].motivo || d.vencimientosLejanos[0].tipo} · {d.vencimientosLejanos[0].causa} ({fechaCorta(d.vencimientosLejanos[0].fecha)})
            </div>
          )}
        </Card>

        <Card>
          <Titulo derecha={<Badge tono="nil">próx. 14 días</Badge>}>Audiencias</Titulo>
          <Lista>
            {d.audiencias.length === 0 && <Vacio>Sin audiencias en los próximos 14 días.</Vacio>}
            {d.audiencias.map((a) => (
              <FilaLista key={a.id}
                titulo={a.causa}
                meta={`${a.titulo}${a.lugar ? ` · ${a.lugar}` : ""}`}
                derecha={<><b className="text-[12px] text-text">{a.hora ? a.hora.slice(0, 5) : "—"}</b><div className="mt-1">{fechaCorta(a.fecha)}</div></>}
                punto="var(--color-cel)" />
            ))}
          </Lista>
        </Card>

        <Card>
          <Titulo derecha={<Badge tono="nil">{n.tareas.vencidas > 0 ? `${n.tareas.vencidas} vencida${n.tareas.vencidas > 1 ? "s" : ""}` : "al día"}</Badge>}>Tareas y recordatorios</Titulo>
          <Lista>
            {tareas.length === 0 && <Vacio>Sin tareas pendientes.</Vacio>}
            {tareas.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-start gap-2.5 border-b border-border py-2.5 last:border-0">
                <input type="checkbox" checked={t.completado} onChange={(e) => marcarTarea(t.id, e.target.checked)}
                  className="mt-1 h-[14px] w-[14px] shrink-0 cursor-pointer accent-blue" aria-label={`Completar ${t.texto}`} />
                <div className={`min-w-0 flex-1 text-[13px] ${t.completado ? "text-muted line-through" : "text-text"}`}>{t.texto}</div>
                {t.fecha_limite && <EtiquetaTarea fecha={t.fecha_limite} hoy={hoy} />}
              </div>
            ))}
          </Lista>
        </Card>
      </div>
    </>
  );
}

function FilaEstado({ color, etiqueta, valor, total }: { color: string; etiqueta: string; valor: number; total: number }) {
  return (
    <li className="flex items-center gap-1.5 border-b border-border py-1.5 last:border-0">
      <span className="inline-block h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: color }} />
      <span className="flex-1 truncate text-[11.5px] text-sub">{etiqueta}</span>
      <span className="flex shrink-0 items-center gap-2 tabular-nums">
        <span className="min-w-[16px] text-center text-[12.5px] font-semibold text-text">{valor}</span>
        <span className="min-w-[28px] text-right text-[11px] text-muted">{total ? Math.round((valor / total) * 100) : 0}%</span>
      </span>
    </li>
  );
}

function RingPct({ pct, color = "var(--color-series-1)", size = 44, stroke = 5 }: { pct: number; color?: string; size?: number; stroke?: number }) {
  const c = size / 2, r = c - stroke - 1, circ = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} style={{ stroke: "var(--color-panel2)" }} />
      {pct > 0 && <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} style={{ stroke: color }} />}
    </svg>
  );
}

function EtiquetaTarea({ fecha, hoy }: { fecha: string; hoy: string }) {
  if (fecha < hoy) return <span className="rounded px-1.5 py-[1px] text-[10px] font-bold tracking-wide text-red" style={{ border: "1px solid color-mix(in srgb, var(--color-red) 45%, transparent)" }}>VENCIDA</span>;
  if (fecha === hoy) return <span className="rounded px-1.5 py-[1px] text-[10px] font-bold tracking-wide text-blue" style={{ border: "1px solid color-mix(in srgb, var(--color-blue) 45%, transparent)" }}>HOY</span>;
  return <span className="rounded px-1.5 py-[1px] text-[10px] font-bold tracking-wide text-muted" style={{ border: "1px solid var(--color-border)" }}>PRÓX.</span>;
}

// En móvil las listas son acordeones; en escritorio se ven siempre.
function Lista({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-[13px] text-muted">{children}</p>;
}

// ───────────────────────── KPIs ─────────────────────────

function Kpis({ d, periodo, moneda, setMoneda, estilo, setEstilo, base, setBase }: Omit<VistaProps, "hoy"> & {
  base: "activas" | "todas";
  setBase: (b: "activas" | "todas") => void;
}) {
  const [monedaDeuda, setMonedaDeuda] = useState<Moneda>("ARS");
  const [monedaTasa, setMonedaTasa] = useState<Moneda>("ARS");
  const n = d.datos;
  const per = nombrePeriodo(periodo, n.periodo);
  const meses = n.causas.nuevasSeisMeses.map((x) => ABREV_MES[Number(x.mes.slice(5, 7)) - 1]);

  const segmentos = [
    { etiqueta: "Judicial", valor: n.causas.judiciales, color: "var(--color-series-1)" },
    { etiqueta: "Extrajudicial", valor: n.causas.extrajudiciales, color: "var(--color-series-2)" },
    { etiqueta: "Cerrada", valor: n.causas.cerradas, color: "var(--color-donut-3)" },
  ];

  const plazosPct = n.gestion.plazosTotal90 > 0 ? Math.round((n.gestion.plazosATiempo90 / n.gestion.plazosTotal90) * 100) : null;
  const etapas = Object.entries(n.gestion.diasPorEtapa).sort((a, b) => b[1] - a[1]);
  const cuello = etapas[0];
  const exitoPct = n.gestion.exito.total > 0 ? Math.round(((n.gestion.exito.ganadas + n.gestion.exito.transadas) / n.gestion.exito.total) * 100) : null;

  const cantidadBase = base === "activas" ? n.causas.activas : n.causas.total;
  const acordadoBase = base === "activas" ? n.financiero.acordadoActivas : n.financiero.acordadoTodas;

  const cobroPct = (m: Moneda) => {
    const f = n.financiero.facturado[m] ?? 0;
    if (!f) return null;
    return Math.round(((n.financiero.cobrado[m] ?? 0) / f) * 100);
  };

  const facturacionFuero = Object.entries(n.financiero.facturacionPorFuero)
    .filter(([k]) => k.startsWith(`${moneda}|`))
    .map(([k, v]) => ({ etiqueta: k.split("|")[1], valor: v }))
    .sort((a, b) => b.valor - a.valor);

  const nuevasPorMes = n.causas.nuevasSeisMeses.map((x) => x.n);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <span>Período: {per.nombre} · {per.comparacion}</span>
      </div>

      <SeccionEncabezado sub="Causas al día de hoy">Cartera</SeccionEncabezado>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <Titulo sub={`${n.causas.total} causas en total`}>Estado de causas</Titulo>
          <div className="grid grid-cols-2 items-center gap-4">
            <Dona segmentos={segmentos} sinLeyenda />
            <ul className="flex min-w-0 flex-col gap-1">
              <FilaEstado color="var(--color-series-1)" etiqueta="Judicial" valor={n.causas.judiciales} total={n.causas.total} />
              <FilaEstado color="var(--color-series-2)" etiqueta="Extrajudicial" valor={n.causas.extrajudiciales} total={n.causas.total} />
              <FilaEstado color="var(--color-donut-3)" etiqueta="Cerrada" valor={n.causas.cerradas} total={n.causas.total} />
            </ul>
          </div>
        </Card>
        <Card>
          <Titulo sub="Activas, por materia">Causas por fuero</Titulo>
          <BarrasH filas={Object.entries(n.causas.activasPorFuero).map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor)} />
        </Card>
        <Card>
          <Titulo sub="Activas, en qué etapa están">Causas por etapa procesal</Titulo>
          <BarrasH filas={Object.entries(n.causas.activasPorEtapa).map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor)} />
        </Card>
      </div>

      <SeccionEncabezado sub="Plazos, gastos y tiempos">Gestión</SeccionEncabezado>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Tile titulo="Plazos cumplidos a tiempo" sub={`${n.gestion.plazosTotal90} plazos en los últimos 90 días`}
          valor={plazosPct === null ? "—" : `${plazosPct}%`}
          extra={<>{plazosPct !== null && <BarraProgreso pct={plazosPct} />}<div className="mt-2 text-[12px] text-muted">{n.gestion.plazosVencidosSinCumplir90} vencieron sin cumplir</div></>} />
        <Tile titulo="Gastos sin reintegrar" valor={formatCurrency(n.gestion.gastosSinReintegrar.monto, "ARS")}
          sub={`en ${n.gestion.gastosSinReintegrar.causas} causas${n.gestion.gastosSinReintegrar.monto > 0 ? ` · ${Math.round((n.gestion.gastosSinReintegrar.peritajes / n.gestion.gastosSinReintegrar.monto) * 100)}% son peritajes` : ""}`} />
        <Tile titulo="Duración promedio" sub="Judiciales cerradas, últimos 2 años"
          valor={n.gestion.duracionMesesJudicial.promedio === null ? "—" : `${Math.round(n.gestion.duracionMesesJudicial.promedio)} meses`}
          extra={Object.keys(n.gestion.duracionMesesJudicial.porFuero).length > 0
            ? <div className="mt-2 text-[12px] text-muted">{Object.entries(n.gestion.duracionMesesJudicial.porFuero).map(([f, m]) => `${f} ${Math.round(m)} m`).join(" · ")}</div>
            : null} />
        <Tile titulo="Días promedio por etapa" sub={cuello ? `Cuello de botella: ${cuello[0]}` : "Sin historial todavía"}
          valor={cuello ? `${cuello[1]} d` : "—"}
          extra={etapas.length > 0 ? <div className="mt-2 text-[12px] text-muted">{etapas.map(([e, dd]) => `${e} ${dd}`).join(" · ")}</div> : null} />
        <Tile titulo="Tasa de éxito en causas" sub="Causas cerradas, últimos 2 años"
          valor={exitoPct === null ? "—" : `${exitoPct}%`}
          extra={n.gestion.exito.total > 0 ? <div className="mt-2 text-[12px] text-muted">Ganadas {n.gestion.exito.ganadas} · Transadas {n.gestion.exito.transadas} · Perdidas {n.gestion.exito.perdidas}</div> : null} />
        <Tile titulo="Audiencias con suspensión" sub={`${n.audiencias.suspendidasMes} de ${n.audiencias.mes} audiencias del mes`}
          valor={n.audiencias.mes > 0 ? `${Math.round((n.audiencias.suspendidasMes / n.audiencias.mes) * 100)}%` : "—"}
          extra={<div className="mt-2 text-[12px] text-muted">Suspendidas o reprogramadas</div>} />
      </div>

      <SeccionEncabezado sub="Resultados y agenda">Audiencias</SeccionEncabezado>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Tile titulo="Tasa de éxito por tipo de audiencia" sub="Éxito = objetivo cumplido · 12 meses" valor="—" grisada />
        <Tile titulo="Audiencias del mes" sub={`${n.audiencias.semana} esta semana · ${n.audiencias.proximos14} en los próximos 14 días`} valor={n.audiencias.mes} />
      </div>

      <SeccionEncabezado sub="Honorarios, cartera y captación">Clientes y cobro</SeccionEncabezado>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <Titulo
            sub={`Cobrado / facturado · ${DUR_PERIODO[periodo]}`}
            derecha={
              <Segmentado titulo="Moneda tasa" valores={["ARS", "USD"] as Moneda[]} actual={monedaTasa} onChange={setMonedaTasa}
                etiquetas={{ ARS: "$", USD: "US$" }} small />
            }
          >Tasa de cobro</Titulo>
          <div className="flex items-center justify-between gap-3">
            <div>
              {(() => {
                const p = cobroPct(monedaTasa);
                return p === null ? (
                  <span className="text-[13px] text-muted">Sin datos en {monedaTasa === "ARS" ? "$" : "US$"}.</span>
                ) : (
                  <>
                    <div className="text-[32px] font-bold leading-none tabular-nums text-text">{p}%</div>
                    <div className="mt-1 text-[12px] text-muted">cobrado sobre facturado</div>
                  </>
                );
              })()}
            </div>
            <RingPct pct={cobroPct(monedaTasa) ?? 0} size={64} stroke={7} />
          </div>
        </Card>
        <Card>
          <Titulo derecha={
            <Segmentado titulo="Base del promedio" valores={["activas", "todas"] as const} actual={base} onChange={setBase}
              etiquetas={{ activas: "s/ activas", todas: "s/ todas" }} />
          } sub={base === "activas" ? "Sobre causas activas" : "Sobre todas las causas"}>Honorario promedio por causa</Titulo>
          <div className="flex flex-col gap-1 text-[20px] font-bold tabular-nums text-text">
            <Montos valores={Object.fromEntries(MONEDAS.map((m) => [m, cantidadBase ? (acordadoBase[m] ?? 0) / cantidadBase : 0]))} />
          </div>
        </Card>
        <Card>
          <Titulo
            sub="Honorarios pendientes por días desde el pacto"
            derecha={
              <Segmentado titulo="Moneda" valores={["ARS", "USD"] as Moneda[]} actual={monedaDeuda} onChange={setMonedaDeuda}
                etiquetas={{ ARS: "$", USD: "US$" }} />
            }
          >Antigüedad de la deuda</Titulo>
          <div className="text-[12px]">
            {(() => {
              const a = n.financiero.antiguedad[monedaDeuda];
              if (!a) return <p className="text-muted py-1">Sin datos en {monedaDeuda === "ARS" ? "$" : "US$"}.</p>;
              return (
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                  <span className="text-muted">0–30 días</span><b className="text-right tabular-nums text-text">{formatCurrency(a.d0_30, monedaDeuda)}</b>
                  <span className="text-muted">31–60 días</span><b className="text-right tabular-nums text-text">{formatCurrency(a.d31_60, monedaDeuda)}</b>
                  <span className="text-muted">Más de 60 días</span><b className="text-right tabular-nums text-text">{formatCurrency(a.d60, monedaDeuda)}</b>
                </div>
              );
            })()}
          </div>
        </Card>
        <Tile titulo="Clientes activos" sub="Con causas abiertas" valor={n.clientes.activos} />
        <Tile titulo="Consultas recibidas" sub="Módulo de captación" valor="—" grisada />
        <Tile titulo="Conversión de consultas" sub="Consultas que pasaron a cliente" valor="—" grisada />
        <Card className="md:col-span-2">
          <Titulo derecha={
            <div className="flex gap-2">
              <Segmentado titulo="Moneda" valores={["ARS", "USD"] as Moneda[]} actual={moneda} onChange={setMoneda}
                etiquetas={{ ARS: "$", USD: "US$" }} />
            </div>
          } sub={`Facturado del período · ${moneda === "ARS" ? "en $" : "en US$"}`}>Facturación por fuero</Titulo>
          <BarrasH filas={facturacionFuero} formato={(v) => formatCurrency(v, moneda)} />
        </Card>
        <Tile titulo="Clientes con saldo" sub="Con honorarios pendientes de cobro" valor={n.clientes.conSaldo} className="flex flex-col justify-center" />
      </div>

      <SeccionEncabezado sub="Entrada de causas">Actividad</SeccionEncabezado>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="md:col-span-2">
          <Titulo derecha={<Segmentado titulo="Gráfico" valores={["barras", "ondas"] as const} actual={estilo} onChange={setEstilo}
            etiquetas={{ barras: "Barras", ondas: "Ondas" }} />} sub="Últimos 6 meses">Causas nuevas por mes</Titulo>
          {estilo === "barras"
            ? <BarrasVerticales meses={meses} valores={nuevasPorMes} />
            : <Ondas meses={meses} series={[{ valores: nuevasPorMes, color: "var(--color-series-1)", posicion: "arriba" }]} formato={(v) => String(Math.round(v))} />}
        </Card>
        <div className="flex flex-col gap-3">
          <Card className="flex flex-1 flex-col justify-center">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-text">Causas nuevas este mes</div>
                <div className="mt-0.5 text-[12px] text-muted">
                  {n.causas.nuevasMesPrev > 0 ? `${n.causas.nuevasMesPrev} el mes anterior` : "Sin causas el mes anterior"}
                </div>
              </div>
              <div className="text-[22px] font-bold tabular-nums text-text">{n.causas.nuevasMes}</div>
            </div>
          </Card>
          <Card className="flex flex-1 flex-col justify-center">
            <div className="mb-3">
              <div className="text-[14px] font-semibold text-text">Causas cerradas con resultado</div>
              <div className="text-[12px] text-muted">Últimos 2 años</div>
            </div>
            <div className="grid grid-cols-2 items-center gap-3">
              <ul className="flex min-w-0 flex-col justify-center gap-3 text-[13px]">
                {[
                  { etiqueta: "Ganadas", valor: n.gestion.exito.ganadas, color: "var(--color-series-1)" },
                  { etiqueta: "Transadas", valor: n.gestion.exito.transadas, color: "var(--color-series-2)" },
                  { etiqueta: "Perdidas", valor: n.gestion.exito.perdidas, color: "var(--color-donut-3)" },
                ].map((f) => (
                  <li key={f.etiqueta} className="flex items-center gap-2 border-b border-border pb-2 last:border-0">
                    <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-text">
                      <span className="inline-block h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: f.color }} />
                      {f.etiqueta}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      <b className="min-w-[18px] text-center text-text">{f.valor}</b>
                      <span className="min-w-[30px] text-right text-[11px] text-muted">{n.gestion.exito.total ? Math.round((f.valor / n.gestion.exito.total) * 100) : 0}%</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-center">
                <Dona sinLeyenda segmentos={[
                  { etiqueta: "Ganadas", valor: n.gestion.exito.ganadas, color: "var(--color-series-1)" },
                  { etiqueta: "Transadas", valor: n.gestion.exito.transadas, color: "var(--color-series-2)" },
                  { etiqueta: "Perdidas", valor: n.gestion.exito.perdidas, color: "var(--color-donut-3)" },
                ]} />
              </div>
            </div>
          </Card>
        </div>
      </div>
      <p className="text-[12px] text-muted">
        <Link href="/causas" className="text-blue hover:underline">Ver causas →</Link>
      </p>
    </>
  );
}
