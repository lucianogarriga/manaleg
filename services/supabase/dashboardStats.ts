import { createClient } from "./server";
import { todayISO } from "@/utils/formatters";

export interface DashboardStats {
  causasActivas: number;
  causasNuevasEste30: number;
  causasNuevasPrev30: number;
  causasSparkline: number[]; // 6 semanas, índice 0 = más antigua
  clientesTotal: number;
  clientesNuevosEste30: number;
  clientesNuevosPrev30: number;
  vencimientosProx7: number;
  vencidosTotal: number;
  audienciasProx30: number;
  honorariosCobradosEste30: number;
  honorariosCobradosPrev30: number;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const hoy = todayISO();
  const hace30 = addDays(hoy, -30);
  const hace60 = addDays(hoy, -60);
  const hace42 = addDays(hoy, -42);
  const en7 = addDays(hoy, 7);
  const en30 = addDays(hoy, 30);

  const [
    activas,
    causasEste30,
    causasPrev30,
    causasSparkRaw,
    clientesAll,
    clientesEste30,
    clientesPrev30,
    vencProx7,
    vencidos,
    audiencias,
    pagosEste30,
    pagosPrev30,
  ] = await Promise.all([
    // Causas activas total
    supabase.from("causas").select("id", { count: "exact", head: true }).neq("estado", "Cerrada"),

    // Causas nuevas este mes
    supabase
      .from("causas")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${hace30}T00:00:00Z`),

    // Causas nuevas mes anterior
    supabase
      .from("causas")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${hace60}T00:00:00Z`)
      .lt("created_at", `${hace30}T00:00:00Z`),

    // Sparks: created_at últimas 6 semanas
    supabase
      .from("causas")
      .select("created_at")
      .gte("created_at", `${hace42}T00:00:00Z`),

    // Total clientes
    supabase.from("clientes").select("id", { count: "exact", head: true }),

    // Clientes nuevos este mes
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${hace30}T00:00:00Z`),

    // Clientes nuevos mes anterior
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${hace60}T00:00:00Z`)
      .lt("created_at", `${hace30}T00:00:00Z`),

    // Vencimientos próximos 7 días
    supabase
      .from("causas")
      .select("id", { count: "exact", head: true })
      .neq("estado", "Cerrada")
      .not("proximo_vencimiento", "is", null)
      .gte("proximo_vencimiento", hoy)
      .lte("proximo_vencimiento", en7),

    // Vencidos (pasados, sin cerrar)
    supabase
      .from("causas")
      .select("id", { count: "exact", head: true })
      .neq("estado", "Cerrada")
      .not("proximo_vencimiento", "is", null)
      .lt("proximo_vencimiento", hoy),

    // Audiencias próximas 30 días
    supabase
      .from("eventos")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "Audiencia")
      .gte("fecha", hoy)
      .lte("fecha", en30),

    // Honorarios cobrados este mes
    supabase
      .from("pagos")
      .select("monto")
      .gte("fecha_pago", hace30),

    // Honorarios cobrados mes anterior
    supabase
      .from("pagos")
      .select("monto")
      .gte("fecha_pago", hace60)
      .lt("fecha_pago", hace30),
  ]);

  // Sparkline: agrupar por semana (6 semanas, de más antigua a más nueva)
  const sparkline = Array(6).fill(0);
  for (const row of causasSparkRaw.data ?? []) {
    const created = row.created_at.slice(0, 10);
    const msAgo = Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${created}T00:00:00Z`);
    const daysAgo = Math.floor(msAgo / 86400000);
    const weekIdx = Math.min(5, Math.floor(daysAgo / 7));
    sparkline[5 - weekIdx]++;
  }

  const sumMonto = (rows: { monto: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + (r.monto ?? 0), 0);

  return {
    causasActivas: activas.count ?? 0,
    causasNuevasEste30: causasEste30.count ?? 0,
    causasNuevasPrev30: causasPrev30.count ?? 0,
    causasSparkline: sparkline,
    clientesTotal: clientesAll.count ?? 0,
    clientesNuevosEste30: clientesEste30.count ?? 0,
    clientesNuevosPrev30: clientesPrev30.count ?? 0,
    vencimientosProx7: vencProx7.count ?? 0,
    vencidosTotal: vencidos.count ?? 0,
    audienciasProx30: audiencias.count ?? 0,
    honorariosCobradosEste30: sumMonto(pagosEste30.data),
    honorariosCobradosPrev30: sumMonto(pagosPrev30.data),
  };
}
