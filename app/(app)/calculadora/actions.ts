"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { TIPOS_AVISO } from "@/utils/constants";
import { isISODate, oneOf, text } from "@/utils/formData";
import type { FormState } from "@/types";

// Carga el resultado de la calculadora como próxima alerta o vencimiento de una causa
export async function saveVencimientoCausa(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const fecha = text(formData, "fecha");
  const tipo = oneOf(text(formData, "tipo"), TIPOS_AVISO) ?? "Vencimiento";
  const motivo = text(formData, "motivo");

  if (!causaId) return { error: "Elegí la causa donde querés cargar el vencimiento." };
  if (motivo && motivo.length > 100) return { error: "El motivo es demasiado largo (máx. 100 caracteres)." };
  if (!isISODate(fecha)) return { error: "Falta la fecha calculada." };

  // Se guarda como vencimiento de la causa (misma tabla que la sección Vencimientos).
  // El trigger de la base recalcula el próximo vencimiento de la causa.
  const supabase = await createClient();
  const { error } = await supabase.from("vencimientos").insert({
    causa_id: causaId,
    tipo,
    fecha,
    motivo: motivo || null,
    anticipacion: "1 día",
  });

  // Si la causa no es accesible, la política de seguridad (RLS) rechaza la fila.
  if (error?.message.includes("row-level security")) return { error: "No se encontró la causa o no tenés acceso." };
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/", "page");
  return { message: `${tipo} cargado en la causa.` };
}
