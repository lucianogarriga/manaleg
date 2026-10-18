"use client";

import { createClient } from "@/services/supabase/client";

// Si el usuario quiere que los demás que comparten la causa vean que la tiene abierta.
// Sin fila guardada, cuenta como visible.
export async function cargarVisibilidadPresencia(causaId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("causa_presencia")
    .select("visible")
    .eq("causa_id", causaId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.visible ?? true;
}

export async function guardarVisibilidadPresencia(causaId: string, userId: string, visible: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("causa_presencia")
    .upsert({ causa_id: causaId, user_id: userId, visible, updated_at: new Date().toISOString() });
  if (error) throw error;
}
