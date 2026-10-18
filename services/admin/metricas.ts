// Consultas del panel de admin. Solo devuelven conteos agregados (ver migraciones 20261017, 20261018 y 20261020).
// Corren con la sesión del admin: la base verifica es_admin y MFA (aal2) en cada función.
import { createClient } from "@/services/supabase/server";

export interface Metricas {
  usuarios: {
    total: number;
    nuevos7: number;
    nuevos30: number;
    porPlan: Record<string, number>;
    porEstadoPago: Record<string, number>;
  };
  causas: {
    total: number;
    porEstado: Record<string, number>;
    promedioPorUsuario: number | null;
    medianaPorUsuario: number | null;
  };
  uso: Record<string, { registros: number; usuarios: number }>;
  registrosPorSemana: { semana: string; registros: number }[];
}

export interface AccesoAdmin {
  seccion: string;
  creado_at: string;
}

// Registra la visita en la auditoría y luego trae las métricas.
export async function cargarMetricas(seccion: string): Promise<Metricas> {
  const supabase = await createClient();
  const { error: errAuditoria } = await supabase.rpc("registrar_acceso_admin", { p_seccion: seccion });
  if (errAuditoria) throw new Error("No autorizado");

  const { data, error } = await supabase.rpc("admin_metricas");
  if (error || !data) throw new Error("No se pudieron cargar las métricas.");
  return data as Metricas;
}

export async function cargarMisAccesos(): Promise<AccesoAdmin[]> {
  const supabase = await createClient();
  const { error: errAuditoria } = await supabase.rpc("registrar_acceso_admin", { p_seccion: "auditoria" });
  if (errAuditoria) throw new Error("No autorizado");

  const { data, error } = await supabase.rpc("mis_accesos_admin");
  if (error) throw new Error("No se pudo cargar la auditoría.");
  return (data ?? []) as AccesoAdmin[];
}
