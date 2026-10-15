import { cache } from "react";
import { createClient } from "./server";

export interface HonorariosPeriodo {
  este30: number;
  prev30: number;
}

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
  honorariosCobrados: Partial<Record<"ARS" | "USD", HonorariosPeriodo>>;
}

interface RespuestaRpc extends Omit<DashboardStats, "honorariosCobrados"> {
  honorariosCobrados: Partial<Record<"ARS" | "USD", HonorariosPeriodo>>;
}

// Los cálculos los hace la base (función estadisticas_dashboard), sin el tope de filas de PostgREST.
async function fetchStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("estadisticas_dashboard");
  if (error) throw new Error(`No se pudieron calcular las estadísticas: ${error.message}`);
  return data as RespuestaRpc;
}

// cache() de React deduplica dentro de la misma request (no entre requests),
// pero sí corre dentro del contexto de la request → cookies disponibles.
// unstable_cache corría fuera del contexto y no podía leer la sesión.
export const getDashboardStats: () => Promise<DashboardStats> = cache(fetchStats);
