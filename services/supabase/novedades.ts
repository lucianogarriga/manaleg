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
  vencimientos: { vencidos: number; urgentes: number; proximos: number; hoy: number };
  audiencias: { hoy: number; semana: number; proximos14: number; mes: number };
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
    duracionMesesJudicial: { promedio: number | null; porFuero: Record<string, number> };
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
}

export interface NovedadesCompletas {
  datos: Novedades;
  vencimientos: VencimientoFila[];
  vencimientosLejanos: VencimientoFila[];
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
  const mes = rangoMes(hoy);

  const [rpc, venc, lejanos, aud, tar, calVenc, calAud, calTar] = await Promise.all([
    supabase.rpc("estadisticas_novedades", { p_periodo: periodo }),
    supabase
      .from("vencimientos")
      .select("id, fecha, tipo, motivo, causa:causas(caratula)")
      .eq("completado", false)
      .lte("fecha", en7)
      .order("fecha", { ascending: true })
      .limit(30),
    supabase
      .from("vencimientos")
      .select("id, fecha, tipo, motivo, causa:causas(caratula)")
      .eq("completado", false)
      .gt("fecha", en7)
      .order("fecha", { ascending: true })
      .limit(1),
    supabase
      .from("eventos")
      .select("id, fecha, hora, titulo, lugar, causa:causas(caratula)")
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
      .select("fecha, completado")
      .gte("fecha", mes.desde)
      .lte("fecha", mes.hasta),
    supabase
      .from("eventos")
      .select("fecha")
      .eq("tipo", "Audiencia")
      .gte("fecha", mes.desde)
      .lte("fecha", mes.hasta),
    supabase
      .from("todos")
      .select("fecha_limite")
      .neq("estado", "Completado")
      .gte("fecha_limite", mes.desde)
      .lte("fecha_limite", mes.hasta),
  ]);

  if (rpc.error) throw new Error(`No se pudieron calcular los indicadores: ${rpc.error.message}`);
  if (venc.error || lejanos.error || aud.error || tar.error || calVenc.error || calAud.error || calTar.error)
    throw new Error("No se pudieron cargar las listas del dashboard.");

  const etiquetaCausa = (c: unknown) => (c as { caratula?: string } | null)?.caratula ?? "Causa";

  // Calendario del mes: un contador por día y tipo.
  const dias = new Map<string, DiaCalendario>();
  const dia = (f: string) => {
    if (!dias.has(f)) dias.set(f, { fecha: f, audiencias: 0, vencimientos: 0, vencidos: 0, tareas: 0 });
    return dias.get(f)!;
  };
  for (const v of calVenc.data ?? []) {
    const d = dia(v.fecha);
    if (!v.completado && v.fecha < hoy) d.vencidos++;
    else d.vencimientos++;
  }
  for (const a of calAud.data ?? []) dia(a.fecha).audiencias++;
  for (const t of calTar.data ?? []) if (t.fecha_limite) dia(t.fecha_limite).tareas++;

  return {
    datos: rpc.data as Novedades,
    vencimientos: (venc.data ?? []).map((v) => ({
      id: v.id, fecha: v.fecha, tipo: v.tipo, motivo: v.motivo, causa: etiquetaCausa(v.causa),
    })),
    vencimientosLejanos: (lejanos.data ?? []).map((v) => ({
      id: v.id, fecha: v.fecha, tipo: v.tipo, motivo: v.motivo, causa: etiquetaCausa(v.causa),
    })),
    audiencias: (aud.data ?? []).map((a) => ({
      id: a.id, fecha: a.fecha, hora: a.hora, titulo: a.titulo, lugar: a.lugar, causa: etiquetaCausa(a.causa),
    })),
    tareas: (tar.data ?? []).map((t) => ({
      id: t.id, texto: t.texto, completado: t.completado === "Completado", fecha_limite: t.fecha_limite,
    })),
    calendario: [...dias.values()],
  };
}

// Cache de React: una sola consulta por request aunque se llame desde varios lugares.
export const cargarNovedadesCacheada = cache(cargarNovedades);
