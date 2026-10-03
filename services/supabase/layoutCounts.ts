import { cache } from "react";
import { createClient } from "./server";
import { addDaysISO, getDaysUntil, todayISO } from "@/utils/formatters";
import type { TipoAviso, TipoNotificacion } from "@/types";

// Próxima alerta o vencimiento de una causa, para la campana del Topbar
export interface AlertaItem {
  causaId: string;
  caratula: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoAviso | null;
  motivo: string | null;
}

// Aviso de que un colega modificó una causa compartida
export interface NotificacionItem {
  id: string;
  causaId: string;
  caratula: string;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  creadaEn: string; // ISO
}

export interface LayoutCounts {
  causasActivas: number;
  vencimientosProximos: number; // vencidos + los de los próximos 3 días (badge de campana y sidebar)
  alertas: AlertaItem[]; // vencidos y próximos 30 días, ordenados por fecha
  notificaciones: NotificacionItem[]; // últimas de colegas
  notificacionesSinLeer: number;
}

const HORIZONTE_DIAS = 30;
const URGENTE_DIAS = 3;
const MAX_NOTIFICACIONES = 25;

type CausaAlertaRow = {
  id: string;
  caratula: string;
  proximo_vencimiento: string;
  tipo_vencimiento: TipoAviso | null;
  motivo_vencimiento: string | null;
};

type NotificacionRow = {
  id: string;
  causa_id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  created_at: string;
  causa: { caratula: string } | null;
};

// Contadores del sidebar y la campana. RLS ya limita a las causas
// propias y compartidas (y a mis notificaciones): no hace falta filtrar por user_id.
// cache() de React deduplica llamadas dentro del mismo render (ej: layout + página
// que también llame a getLayoutCounts). No persiste entre requests.
export const getLayoutCounts: () => Promise<LayoutCounts> = cache(async function getLayoutCounts(): Promise<LayoutCounts> {
  const supabase = await createClient();
  const hoy = todayISO();

  const [activas, avisos, notifs, sinLeer] = await Promise.all([
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
    supabase
      .from("notificaciones")
      .select("id, causa_id, tipo, mensaje, leida, created_at, causa:causas(caratula)")
      .order("created_at", { ascending: false })
      .limit(MAX_NOTIFICACIONES)
      .returns<NotificacionRow[]>(),
    supabase.from("notificaciones").select("id", { count: "exact", head: true }).eq("leida", false),
  ]);

  const alertas: AlertaItem[] = (avisos.data ?? []).map((c) => ({
    causaId: c.id,
    caratula: c.caratula,
    fecha: c.proximo_vencimiento,
    tipo: c.tipo_vencimiento,
    motivo: c.motivo_vencimiento,
  }));

  const notificaciones: NotificacionItem[] = (notifs.data ?? []).map((n) => ({
    id: n.id,
    causaId: n.causa_id,
    caratula: n.causa?.caratula ?? "Causa",
    tipo: n.tipo,
    mensaje: n.mensaje,
    leida: n.leida,
    creadaEn: n.created_at,
  }));

  return {
    causasActivas: activas.count ?? 0,
    vencimientosProximos: alertas.filter((a) => (getDaysUntil(a.fecha) ?? 99) <= URGENTE_DIAS).length,
    alertas,
    notificaciones,
    notificacionesSinLeer: sinLeer.count ?? 0,
  };
});
