"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { TIPOS_AVISO } from "@/utils/constants";
import { isISODate, oneOf, text } from "@/utils/formData";
import type { FormState } from "@/types";

// Carga el resultado de la calculadora como próxima alerta o vencimiento de una causa
export async function guardarVencimientoEnCausa(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const fecha = text(formData, "fecha");
  const tipo = oneOf(text(formData, "tipo"), TIPOS_AVISO) ?? "Vencimiento";
  const motivo = text(formData, "motivo");

  if (!causaId) return { error: "Elegí la causa donde querés cargar el vencimiento." };
  if (motivo && motivo.length > 100) return { error: "El motivo es demasiado largo (máx. 100 caracteres)." };
  if (!isISODate(fecha)) return { error: "Falta la fecha calculada." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causas")
    .update({ proximo_vencimiento: fecha, tipo_vencimiento: tipo, motivo_vencimiento: motivo })
    .eq("id", causaId)
    .select("id");

  if (error) return { error: `No se pudo guardar: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se encontró la causa o no tenés acceso." };

  revalidatePath("/", "layout");
  return { message: `${tipo} cargado en la causa.` };
}
