"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { text } from "@/utils/formData";
import type { FormState } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Comparte una causa con otro usuario ya registrado (se lo busca por email).
// RLS: solo el titular de la causa puede crear el acceso.
export async function shareCausa(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const email = text(formData, "email")?.toLowerCase();

  if (!causaId) return { error: "Falta la causa." };
  if (!email || !EMAIL_RE.test(email)) return { error: "Ingresá un email válido." };

  const supabase = await createClient();

  const { data: causa } = await supabase
    .from("causas")
    .select("id, user_id")
    .eq("id", causaId)
    .maybeSingle<{ id: string; user_id: string }>();
  if (!causa) return { error: "No se encontró la causa." };

  // Usa función SECURITY DEFINER para buscar por email sin exponer RLS
  const { data: colega } = await supabase
    .rpc("buscar_perfil_por_email", { p_email: email })
    .maybeSingle<{ id: string; nombre_completo: string | null; email: string }>();

  if (!colega) {
    return { error: "No hay ningún usuario registrado con ese email. Pedile que primero cree su cuenta en MANALEG." };
  }
  if (colega.id === causa.user_id) return { error: "Ese usuario ya es el titular de la causa." };

  const { error } = await supabase
    .from("causa_shares")
    .insert({ causa_id: causaId, shared_with_user_id: colega.id });

  if (error) {
    if (error.code === "23505") return { error: `${colega.nombre_completo ?? colega.email} ya tiene acceso a esta causa.` };
    return { error: `No se pudo compartir la causa: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { message: `Causa compartida con ${colega.nombre_completo ?? colega.email}.` };
}

export async function revokeAccess(shareId: string): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("causa_shares").delete().eq("id", shareId).select("id");

  if (error) return { error: `No se pudo quitar el acceso: ${error.message}` };
  if (!data || data.length === 0) return { error: "Solo el titular de la causa puede quitar el acceso." };

  revalidatePath("/", "layout");
  return { message: "Acceso quitado." };
}
