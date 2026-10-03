import { unstable_cache } from "next/cache";
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

// Ejecuta las 6 queries reales. Se llama solo en cache miss.
async function fetchStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const hoy = todayISO();
  const hace30 = addDays(hoy, -30);
  const hace60 = addDays(hoy, -60);
  const en7    = addDays(hoy, 7);
  const en30   = addDays(hoy, 30);

  const [
    activas,          // Q1: causas activas (count)
    causasRecientes,  // Q2: causas últimos 60d → nuevas este30, prev30, sparkline
    vencimientos,     // Q3: causas con vencimiento open → prox7 + vencidos
    clientes,         // Q4: todos los clientes (created_at) → total, este30, prev30
    audiencias,       // Q5: audiencias próximas 30d (count)
    pagos,            // Q6: pagos últimos 60d → cobrado este30 + prev30
  ] = await Promise.all([

    // Q1 — causas activas (solo count)
    supabase
      .from("causas")
      .select("id", { count: "exact", head: true })
      .neq("estado", "Cerrada"),

    // Q2 — fechas de causas creadas en los últimos 60 días
    supabase
      .from("causas")
      .select("created_at")
      .gte("created_at", `${hace60}T00:00:00Z`),

    // Q3 — causas abiertas con vencimiento ≤ próximos 7 días (incluye vencidos)
    supabase
      .from("causas")
      .select("proximo_vencimiento")
      .neq("estado", "Cerrada")
      .not("proximo_vencimiento", "is", null)
      .lte("proximo_vencimiento", en7),

    // Q4 — todos los clientes (solo created_at, liviano)
    supabase
      .from("clientes")
      .select("created_at"),

    // Q5 — audiencias próximas 30 días (solo count)
    supabase
      .from("eventos")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "Audiencia")
      .gte("fecha", hoy)
      .lte("fecha", en30),

    // Q6 — pagos de los últimos 60 días
    supabase
      .from("pagos")
      .select("monto, fecha_pago")
      .gte("fecha_pago", hace60),
  ]);

  // ── Q2: desglose de causas recientes ────────────────────────────
  const causasData = causasRecientes.data ?? [];
  let causasNuevasEste30 = 0;
  let causasNuevasPrev30 = 0;
  const sparkline = Array(6).fill(0);
  const hace30ms = Date.parse(`${hace30}T00:00:00Z`);
  const hoyMs    = Date.parse(`${hoy}T00:00:00Z`);

  for (const row of causasData) {
    const ts = Date.parse(row.created_at);
    if (ts >= hace30ms) causasNuevasEste30++;
    else causasNuevasPrev30++;

    // Sparkline: 6 semanas (últimas 42 días), idx 0 = más antigua
    const daysAgo = Math.floor((hoyMs - ts) / 86400000);
    if (daysAgo <= 42) {
      const weekIdx = Math.min(5, Math.floor(daysAgo / 7));
      sparkline[5 - weekIdx]++;
    }
  }

  // ── Q3: vencimientos ────────────────────────────────────────────
  const vencData = vencimientos.data ?? [];
  let vencimientosProx7 = 0;
  let vencidosTotal = 0;
  for (const row of vencData) {
    const v = row.proximo_vencimiento as string;
    if (v < hoy) vencidosTotal++;
    else vencimientosProx7++;
  }

  // ── Q4: clientes ────────────────────────────────────────────────
  const clientesData = clientes.data ?? [];
  const clientesTotal = clientesData.length;
  let clientesNuevosEste30 = 0;
  let clientesNuevosPrev30 = 0;
  for (const row of clientesData) {
    const ts = Date.parse(row.created_at);
    if (ts >= hace30ms) clientesNuevosEste30++;
    else if (ts >= Date.parse(`${hace60}T00:00:00Z`)) clientesNuevosPrev30++;
  }

  // ── Q6: pagos ───────────────────────────────────────────────────
  const pagosData = pagos.data ?? [];
  let honorariosCobradosEste30 = 0;
  let honorariosCobradosPrev30 = 0;
  for (const row of pagosData) {
    const ts = Date.parse(row.fecha_pago);
    if (ts >= hace30ms) honorariosCobradosEste30 += row.monto ?? 0;
    else honorariosCobradosPrev30 += row.monto ?? 0;
  }

  return {
    causasActivas: activas.count ?? 0,
    causasNuevasEste30,
    causasNuevasPrev30,
    causasSparkline: sparkline,
    clientesTotal,
    clientesNuevosEste30,
    clientesNuevosPrev30,
    vencimientosProx7,
    vencidosTotal,
    audienciasProx30: audiencias.count ?? 0,
    honorariosCobradosEste30,
    honorariosCobradosPrev30,
  };
}

// Cache de 60s por usuario. El userId entra como argumento → clave única por usuario.
const getCachedStats = unstable_cache(
  (_userId: string) => fetchStats(),
  ["dashboard-stats"],
  { revalidate: 60, tags: ["dashboard-stats"] }
);

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return getCachedStats(user.id);
}
