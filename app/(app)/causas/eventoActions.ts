"use server";

import { createEvento, updateEvento, deleteEvento } from "@/services/supabase/eventos";
import type { TipoEvento } from "@/types";
import { TIPOS_EVENTO } from "@/utils/constants";

interface ActionResult { message?: string; error?: string }

export async function guardarEvento(
  causaId: string,
  eventoId: string | null,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const titulo = (formData.get("titulo") as string)?.trim();
  const tipo = formData.get("tipo") as TipoEvento;
  const fecha = formData.get("fecha") as string;
  const hora = (formData.get("hora") as string) || null;
  const lugar = (formData.get("lugar") as string)?.trim() || null;
  const notas = (formData.get("notas") as string)?.trim() || null;

  if (!titulo) return { error: "El título es obligatorio." };
  if (!fecha) return { error: "La fecha es obligatoria." };
  if (!TIPOS_EVENTO.includes(tipo)) return { error: "Tipo de evento inválido." };

  try {
    if (eventoId) {
      await updateEvento(eventoId, { titulo, tipo, fecha, hora, lugar, notas });
      return { message: "Evento actualizado." };
    } else {
      await createEvento(causaId, { titulo, tipo, fecha, hora, lugar, notas });
      return { message: "Evento agregado." };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function eliminarEvento(id: string): Promise<ActionResult> {
  try {
    await deleteEvento(id);
    return { message: "Evento eliminado." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
