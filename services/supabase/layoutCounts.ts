import { createClient } from "./server";
import { addDaysISO, todayISO } from "@/utils/formatters";

export interface LayoutCounts {
  causasActivas: number;
  vencimientosProximos: number; // pendientes en los próximos 3 días
}

// Contadores del sidebar y la campana. RLS ya limita a las causas
// propias y compartidas, no hace falta filtrar por user_id.
export async function getLayoutCounts(): Promise<LayoutCounts> {
  const supabase = await createClient();
  const hoy = todayISO();

  const [causas, vencimientos] = await Promise.all([
    supabase
      .from("causas")
      .select("id", { count: "exact", head: true })
      .neq("estado", "Cerrada"),
    supabase
      .from("vencimientos")
      .select("id", { count: "exact", head: true })
      .eq("estado_alerta", "Pendiente")
      .gte("fecha_vencimiento", hoy)
      .lte("fecha_vencimiento", addDaysISO(hoy, 3)),
  ]);

  return {
    causasActivas: causas.count ?? 0,
    vencimientosProximos: vencimientos.count ?? 0,
  };
}
