import { createClient } from "./server";
import { addDaysISO, getDaysUntil, todayISO } from "@/utils/formatters";
import type { TipoAviso } from "@/types";

// Próxima alerta o vencimiento de una causa, para la campana del Topbar
export interface AlertaItem {
  causaId: string;
  caratula: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoAviso | null;
  motivo: string | null;
}

export interface LayoutCounts {
  causasActivas: number;
  vencimientosProximos: number; // vencidos + los de los próximos 3 días (badge de campana y sidebar)
  alertas: AlertaItem[]; // vencidos y próximos 30 días, ordenados por fecha
}

const HORIZONTE_DIAS = 30;
const URGENTE_DIAS = 3;

type CausaAlertaRow = {
  id: string;
  caratula: string;
  proximo_vencimiento: string;
  tipo_vencimiento: TipoAviso | null;
  motivo_vencimiento: string | null;
};

// Contadores del sidebar y la campana. RLS ya limita a las causas
// propias y compartidas, no hace falta filtrar por user_id.
export async function getLayoutCounts(): Promise<LayoutCounts> {
  const supabase = await createClient();
  const hoy = todayISO();

  const [activas, avisos] = await Promise.all([
    supabase.from("causas").select("id", { count: "exact", head: true }).neq("estado", "Cerrada"),
    supabase
      .from("causas")
      .select("id, caratula, proximo_vencimiento, tipo_vencimiento, motivo_vencimiento")
      .neq("estado", "Cerrada")
      .not("proximo_vencimiento", "is", null)
      .lte("proximo_vencimiento", addDaysISO(hoy, HORIZONTE_DIAS))
      .order("proximo_vencimiento", { ascending: true })
      .limit(30)
      .returns<CausaAlertaRow[]>(),
  ]);

  const alertas: AlertaItem[] = (avisos.data ?? []).map((c) => ({
    causaId: c.id,
    caratula: c.caratula,
    fecha: c.proximo_vencimiento,
    tipo: c.tipo_vencimiento,
    motivo: c.motivo_vencimiento,
  }));

  return {
    causasActivas: activas.count ?? 0,
    vencimientosProximos: alertas.filter((a) => (getDaysUntil(a.fecha) ?? 99) <= URGENTE_DIAS).length,
    alertas,
  };
}
