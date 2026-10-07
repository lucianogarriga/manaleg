"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { text } from "@/utils/formData";
import type { FormState } from "@/types";

const refresh = () => revalidatePath("/", "layout");

export async function createTodo(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const texto = text(formData, "texto")?.trim();
  const fechaLimite = text(formData, "fecha_limite") || null;

  if (!texto) return { error: "Ingresá el texto de la tarea." };
  if (texto.length > 300) return { error: "La tarea es demasiado larga (máx. 300 caracteres)." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("todos").insert({
    causa_id: causaId || null,
    user_id: user.id,
    texto,
    estado: "Pendiente",
    fecha_limite: fechaLimite,
  });

  if (error) return { error: `No se pudo guardar la tarea: ${error.message}` };
  refresh();
  return { message: "Tarea agregada." };
}

export async function toggleTodo(id: string, completado: boolean): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .update({ completado, estado: completado ? "Completado" : "Pendiente" })
    .eq("id", id)
    .select("id");

  if (error) return { error: `No se pudo actualizar la tarea: ${error.message}` };
  if (!data || data.length === 0) return { error: "No tenés permiso para modificar esta tarea." };
  refresh();
  return { message: "Tarea actualizada." };
}

export async function updateTodoEstado(id: string, estado: string): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data, error } = await supabase
    .from("todos")
    .update({ estado, completado: estado === "Completado" })
    .eq("id", id)
    .select("id");

  if (error) return { error: `No se pudo mover la tarea: ${error.message}` };
  if (!data || data.length === 0) return { error: "No tenés permiso para modificar esta tarea." };
  refresh();
  return { message: "Tarea movida." };
}

export async function deleteTodo(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("todos").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar la tarea: ${error.message}` };
  if (!data || data.length === 0) return { error: "No tenés permiso para eliminar esta tarea." };
  refresh();
  return { message: "Tarea eliminada." };
}
