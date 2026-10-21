"use server";

import { createClient } from "@/services/supabase/server";
import { cargarNovedades, type NovedadesCompletas, type Periodo } from "@/services/supabase/novedades";
import type { FormState } from "@/types";

const PERIODOS: Periodo[] = ["mes", "trim", "anio"];

// Recarga los indicadores al cambiar el período en el dashboard.
export async function recargarNovedades(periodo: string): Promise<NovedadesCompletas | { error: string }> {
  if (!PERIODOS.includes(periodo as Periodo)) return { error: "Período no válido." };
  try {
    return await cargarNovedades(periodo as Periodo);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudieron cargar los datos." };
  }
}

// Guarda Barras | Ondas como preferencia del usuario (columna preferencia_graficos).
export async function guardarPreferenciaGraficos(valor: string): Promise<FormState> {
  if (valor !== "barras" && valor !== "ondas") return { error: "Preferencia no válida." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ preferencia_graficos: valor })
    .eq("id", user.id)
    .select("id");

  if (error) return { error: "No se pudo guardar tu preferencia de gráficos." };
  return {};
}
