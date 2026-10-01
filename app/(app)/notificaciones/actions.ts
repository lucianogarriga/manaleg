"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";

// Marca como leídas mis notificaciones (RLS limita a las propias).
// Sin ids → todas las pendientes.
export async function marcarNotificacionesLeidas(ids?: string[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  let query = supabase.from("notificaciones").update({ leida: true }).eq("leida", false);
  if (ids) query = query.in("id", ids);

  const { error } = await query;
  if (error) return { error: `No se pudieron marcar como leídas: ${error.message}` };

  revalidatePath("/", "layout");
  return {};
}
