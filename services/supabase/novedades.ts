import { cache } from "react";
import { createClient } from "./server";
import { addDaysISO, todayISO } from "@/utils/formatters";

export type Periodo = "mes" | "trim" | "anio";
export type Moneda = "ARS" | "USD";
export type Dinero = Partial<Record<Moneda, number>>;

// Forma de lo que devuelve estadisticas_novedades (ver migración 20261023_novedades).
export interface Novedades {
  periodo: { desde: string; hasta: string; prevDesde: string; prevHasta: string };
  causas: {
    total: number;
    activas: number;
    judiciales: number;
    extrajudiciales: number;
    cerradas: number;
    activasPorEstado: Record<string, number>;
    activasPorFuero: Record<string, number>;
    activasPorEtapa: Record<string, number>;
    nuevasMes: number;
    nuevasMesPrev: number;
    nuevasPeriodo: number;
    nuevasPeriodoPrev: number;
    inactivas30: number;
    nuevasSeisMeses: { mes: string; n: number }[];
  };
  vencimientos: { vencidos: number; vencidosAntiguos: number; urgentes: number; proximos: number; hoy: number };
  audiencias: { hoy: number; semana: number; proximos14: number; mes: number; suspendidasMes: number };
  tareas: { hoy: number; vencidas: number };
  financiero: {
    cobrado: Dinero;
    cobradoPrev: Dinero;
    facturado: Dinero;
    facturadoPrev: Dinero;
    pendientePeriodo: Dinero;
    pendienteTotal: Dinero;
    pendienteCausasTotal: number;
    antiguedad: Record<Moneda, { d0_30: number; d31_60: number; d60: number }>;
    acordadoTodas: Dinero;
    acordadoActivas: Dinero;
    facturacionPorFuero: Record<string, number>; // clave "MONEDA|fuero"
    seisMeses: { mes: string; cobrado: Dinero; pendiente: Dinero }[];
  };
  gestion: {
    plazosTotal90: number;
    plazosATiempo90: number;
    plazosVencidosSinCumplir90: number;
    gastosSinReintegrar: { monto: number; causas: number; peritajes: number };
    diasPorEtapa: Record<string, number>;
    duracionMesesJudicial: { promedio: number | null; n: number; porFuero: Record<string, number> };
    duracionMesesExtrajudicial: { promedio: number | null; n: number };
    exito: { total: number; ganadas: number; transadas: number; perdidas: number };
  };
  clientes: { total: number; activos: number; conSaldo: number };
}

export interface VencimientoFila {
  id: string;
  fecha: string;
  tipo: string;
  motivo: string | null;
  causa: string;
}

export interface AudienciaFila {
  id: string;
  fecha: string;
  hora: string | null;
  titulo: string;
  lugar: string | null;
  causa: string;
}

export interface TareaFila {
  id: string;
  texto: string;
  completado: boolean;
  fecha_limite: string | null;
}

export interface DiaCalendario {
  fecha: string;
  audiencias: number;
  vencimientos: number;
  vencidos: number;
  tareas: number;
  detalle: string[];
}

// Últimas 7 semanas (la más antigua primero), para las barras de tendencia.
export interface Tendencias {
  causasActivas: number[];
  vencimientos: number[];
  inactivas: number[];
  cobrado: number[];
  pendientePeriodo: number[];
  pendienteTotal: number[];
}

export interface NovedadesCompletas {
  datos: Novedades;
  tendencias: Tendencias;
  // Causas judiciales (sin extrajudiciales) por estado, para el detalle de Estado de causas.
  judicialesPorEstado: Record<string, number>;
  vencimientos: VencimientoFila[];
  vencimientosLejanos: VencimientoFila[];
  vencimientosAntiguos: VencimientoFila[];
  audiencias: AudienciaFila[];
  tareas: TareaFila[];
  calendario: DiaCalendario[];
}

// Rango de un mes calendario, en formato YYYY-MM-DD.
function rangoMes(iso: string): { desde: string; hasta: string } {
  const [y, m] = iso.split("-").map(Number);
  const desde = `${y}-${String(m).padStart(2, "0")}-01`;
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { desde, hasta: `${y}-${String(m).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}` };
}

export async function cargarNovedades(periodo: Periodo): Promise<NovedadesCompletas> {
  const supabase = await createClient();
  const hoy = todayISO();
  const en7 = addDaysISO(hoy, 7);
  const en14 = addDaysISO(hoy, 14);
  const hace30 = addDaysISO(hoy, -30);
  const mes = rangoMes(hoy);

  const estadosJudiciales = ["Iniciada", "En trámite", "Con resolución", "En ejecución"] as const;
  const judicialesQ = Promise.all(
    estadosJudiciales.map((e) =>
      supabase.from("causas").select("id", { count: "exact", head: true })
        .eq("estado", e).or("fuero.is.null,fuero.neq.Extrajudicial")),
  );

  const [rpc, tend, venc, lejanos, antiguos, aud, tar, calVenc, calAud, calTar] = await Promise.all([
    supabase.rpc("estadisticas_novedades", { p_periodo: periodo }),
    supabase.rpc("estadisticas_tendencias"),
    supabase
      .from("vencimientos")
      .select("id, fecha, tipo, motivo, causa:causas(caratula)")
      .neq("tipo", "Audiencia")
      .eq("completado", false)
      .gte("fecha", hace30)
      .lte("fecha", en7)
      .order("fecha", { ascending: true })
      .limit(30),
    supabase
      .from("vencimientos")
      .select("id, fecha, tipo, motivo, causa:causas(caratula)")
      .neq("tipo", "Audiencia")
      .eq("completado", false)
      .gt("fecha", en7)
      .order("fecha", { ascending: true })
      .limit(1),
    supabase
      .from("vencimientos")
      .select("id, fecha, tipo, motivo, causa:causas(caratula)")
      .neq("tipo", "Audiencia")
      .eq("completado", false)
      .lt("fecha", hace30)
      .order("fecha", { ascending: false })
      .limit(200),
    supabase
      .from("vencimientos")
      .select("id, fecha, hora, motivo, lugar, causa:causas(caratula)")
      .eq("tipo", "Audiencia")
      .gte("fecha", hoy)
      .lte("fecha", en14)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true })
      .limit(30),
    supabase
      .from("todos")
      .select("id, texto, completado:estado, fecha_limite")
      .neq("estado", "Completado")
      .order("fecha_limite", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("vencimientos")
      .select("fecha, completado, tipo, motivo, causa:causas(caratula)")
      .neq("tipo", "Audiencia")
      .gte("fecha", mes.desde)
      .lte("fecha", mes.hasta),
    supabase
      .from("vencimientos")
      .select("fecha, motivo, causa:causas(caratula)")
      .eq("tipo", "Audiencia")
      .gte("fecha", mes.desde)
      .lte("fecha", mes.hasta),
    supabase
      .from("todos")
      .select("fecha_limite, texto")
      .neq("estado", "Completado")
      .gte("fecha_limite", mes.desde)
      .lte("fecha_limite", mes.hasta),
  ]);

  if (rpc.error) throw new Error(`No se pudieron calcular los indicadores: ${rpc.error.message}`);
  if (tend.error) throw new Error(`No se pudieron calcular las tendencias: ${tend.error.message}`);
  if (venc.error || lejanos.error || antiguos.error || aud.error || tar.error || calVenc.error || calAud.error || calTar.error)
    throw new Error("No se pudieron cargar las listas del dashboard.");

  const etiquetaCausa = (c: unknown) => (c as { caratula?: string } | null)?.caratula ?? "Causa";

  // Calendario del mes: un contador por día y tipo.
  const dias = new Map<string, DiaCalendario>();
  const dia = (f: string) => {
    if (!dias.has(f)) dias.set(f, { fecha: f, audiencias: 0, vencimientos: 0, vencidos: 0, tareas: 0, detalle: [] });
    return dias.get(f)!;
  };
  for (const v of calVenc.data ?? []) {
    const d = dia(v.fecha);
    const vencido = !v.completado && v.fecha < hoy;
    if (vencido) d.vencidos++;
    else d.vencimientos++;
    d.detalle.push(`${vencido ? "Vencido" : "Vencimiento"} · ${v.motivo || v.tipo} · ${etiquetaCausa(v.causa)}`);
  }
  for (const a of calAud.data ?? []) {
    const d = dia(a.fecha);
    d.audiencias++;
    d.detalle.push(`Audiencia · ${a.motivo || "Audiencia"} · ${etiquetaCausa(a.causa)}`);
  }
  for (const t of calTar.data ?? []) {
    if (!t.fecha_limite) continue;
    const d = dia(t.fecha_limite);
    d.tareas++;
    d.detalle.push(`Tarea · ${t.texto}`);
  }

  const judiciales = await judicialesQ;
  const judicialesPorEstado: Record<string, number> = {};
  estadosJudiciales.forEach((e, i) => {
    if (judiciales[i].error) throw new Error("No se pudo calcular el detalle de causas judiciales.");
    judicialesPorEstado[e] = judiciales[i].count ?? 0;
  });

  return {
    judicialesPorEstado,
    datos: rpc.data as Novedades,
    tendencias: tend.data as Tendencias,
    vencimientos: (venc.data ?? []).map((v) => ({
      id: v.id, fecha: v.fecha, tipo: v.tipo, motivo: v.motivo, causa: etiquetaCausa(v.causa),
    })),
    vencimientosLejanos: (lejanos.data ?? []).map((v) => ({
      id: v.id, fecha: v.fecha, tipo: v.tipo, motivo: v.motivo, causa: etiquetaCausa(v.causa),
    })),
    vencimientosAntiguos: (antiguos.data ?? []).map((v) => ({
      id: v.id, fecha: v.fecha, tipo: v.tipo, motivo: v.motivo, causa: etiquetaCausa(v.causa),
    })),
    audiencias: (aud.data ?? []).map((a) => ({
      id: a.id, fecha: a.fecha, hora: a.hora, titulo: a.motivo || "Audiencia", lugar: a.lugar, causa: etiquetaCausa(a.causa),
    })),
    tareas: (tar.data ?? []).map((t) => ({
      id: t.id, texto: t.texto, completado: t.completado === "Completado", fecha_limite: t.fecha_limite,
    })),
    calendario: [...dias.values()],
  };
}

// Cache de React: una sola consulta por request aunque se llame desde varios lugares.
export const cargarNovedadesCacheada = cache(cargarNovedades);
