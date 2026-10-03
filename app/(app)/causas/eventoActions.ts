"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createEvento, updateEvento, deleteEvento } from "@/services/supabase/eventos";
import { TIPOS_EVENTO } from "@/utils/constants";
import type { TipoEvento } from "@/types";

interface ActionResult { message?: string; error?: string }

const EventoSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio.").max(300, "El título es demasiado largo."),
  tipo: z
    .string()
    .refine((v): v is TipoEvento => (TIPOS_EVENTO as readonly string[]).includes(v), "Tipo de evento inválido."),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no tiene un formato válido.")
    .refine(v => !isNaN(Date.parse(v)), "La fecha no existe."),
  hora: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "La hora no tiene un formato válido.")
    .nullable()
    .optional()
    .or(z.literal("")),
  lugar: z.string().max(300, "El lugar es demasiado largo.").nullable().optional(),
  notas: z.string().max(2000, "Las notas son demasiado largas.").nullable().optional(),
});

export async function guardarEvento(
  causaId: string,
  eventoId: string | null,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    titulo: (formData.get("titulo") as string ?? "").trim(),
    tipo:   (formData.get("tipo")   as string ?? ""),
    fecha:  (formData.get("fecha")  as string ?? ""),
    hora:   (formData.get("hora")   as string ?? "") || null,
    lugar:  ((formData.get("lugar") as string | null) ?? "").trim() || null,
    notas:  ((formData.get("notas") as string | null) ?? "").trim() || null,
  };

  const parsed = EventoSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { titulo, tipo, fecha, hora, lugar, notas } = parsed.data;
  const horaFinal = hora === "" ? null : (hora ?? null);
  const input = { titulo, tipo: tipo as TipoEvento, fecha, hora: horaFinal, lugar: lugar ?? null, notas: notas ?? null };

  try {
    if (eventoId) {
      await updateEvento(eventoId, input);
    } else {
      await createEvento(causaId, input);
    }
    revalidatePath(`/causas`);
    return { message: eventoId ? "Evento actualizado." : "Evento agregado." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function eliminarEvento(id: string): Promise<ActionResult> {
  try {
    await deleteEvento(id);
    revalidatePath(`/causas`);
    return { message: "Evento eliminado." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
