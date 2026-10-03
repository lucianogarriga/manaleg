"use server";

import { z } from "zod";
import { createCliente, updateCliente, deleteCliente } from "@/services/supabase/clientes";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/types";

const ClienteSchema = z.object({
  nombre_completo: z.string().min(1, "El nombre es obligatorio.").max(200, "El nombre es demasiado largo."),
  dni_cuit: z.string().max(30, "DNI/CUIT demasiado largo.").nullable().optional(),
  telefono: z.string().max(30, "Teléfono demasiado largo.").nullable().optional(),
  email: z
    .string()
    .max(254, "Email demasiado largo.")
    .email("El email no tiene un formato válido.")
    .nullable()
    .optional()
    .or(z.literal("")),
  notas: z.string().max(2000, "Las notas son demasiado largas.").nullable().optional(),
});

function extractInput(formData: FormData) {
  return {
    nombre_completo: (formData.get("nombre_completo") as string ?? "").trim(),
    dni_cuit:  ((formData.get("dni_cuit")  as string | null) ?? "").trim() || null,
    telefono:  ((formData.get("telefono")  as string | null) ?? "").trim() || null,
    email:     ((formData.get("email")     as string | null) ?? "").trim() || null,
    notas:     ((formData.get("notas")     as string | null) ?? "").trim() || null,
  };
}

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) out[k] = v instanceof File ? "" : v;
  return out;
}

export async function guardarCliente(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id") as string | null;
  const raw = extractInput(formData);
  const parsed = ClienteSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, values: formValues(formData) };
  }

  const input = {
    nombre_completo: parsed.data.nombre_completo,
    dni_cuit:  parsed.data.dni_cuit  ?? null,
    telefono:  parsed.data.telefono  ?? null,
    email:     (parsed.data.email === "" ? null : parsed.data.email) ?? null,
    notas:     parsed.data.notas     ?? null,
  };

  const { error } = id ? await updateCliente(id, input) : await createCliente(input);
  if (error) return { error: error.message, values: formValues(formData) };

  revalidatePath("/clientes");
  return { message: id ? "Cliente actualizado." : "Cliente creado." };
}

export async function eliminarCliente(id: string): Promise<FormState> {
  const { error } = await deleteCliente(id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { message: "Cliente eliminado." };
}
