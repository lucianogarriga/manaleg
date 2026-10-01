"use server";

import { createCliente, updateCliente, deleteCliente, type ClienteInput } from "@/services/supabase/clientes";
import type { FormState } from "@/types";

function extractInput(formData: FormData): ClienteInput {
  return {
    nombre_completo: (formData.get("nombre_completo") as string).trim(),
    dni_cuit: (formData.get("dni_cuit") as string | null)?.trim() || null,
    telefono: (formData.get("telefono") as string | null)?.trim() || null,
    email: (formData.get("email") as string | null)?.trim() || null,
    notas: (formData.get("notas") as string | null)?.trim() || null,
  };
}

export async function guardarCliente(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id") as string | null;
  const input = extractInput(formData);

  if (!input.nombre_completo) {
    return { error: "El nombre es obligatorio.", values: Object.fromEntries(formData) };
  }

  const { error } = id
    ? await updateCliente(id, input)
    : await createCliente(input);

  if (error) return { error: error.message, values: Object.fromEntries(formData) };

  return { message: id ? "Cliente actualizado." : "Cliente creado." };
}

export async function eliminarCliente(id: string): Promise<FormState> {
  const { error } = await deleteCliente(id);
  if (error) return { error: error.message };
  return { message: "Cliente eliminado." };
}
