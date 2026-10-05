"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { isISODate, parseMonto, text } from "@/utils/formData";
import type { FormState } from "@/types";

const TIPOS_GASTO = [
  "Carta documento",
  "Notificación",
  "Tasa de justicia",
  "Aporte previsional",
  "Pericial",
  "Honorarios peritos",
  "Medida cautelar",
  "Otro",
] as const;

const refresh = () => revalidatePath("/", "layout");

export async function addGasto(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const descripcion = text(formData, "descripcion");
  const fecha = text(formData, "fecha");
  const monto = parseMonto(text(formData, "monto"));
  const link = text(formData, "comprobante_url");

  if (!causaId) return { error: "Falta la causa." };
  if (!descripcion) return { error: "Ingresá una descripción del gasto." };
  if (descripcion.length > 500) return { error: "La descripción es demasiado larga (máx. 500 caracteres)." };
  if (monto === null || monto === "invalid" || monto < 0) return { error: "Ingresá un monto válido." };
  if (fecha && !isISODate(fecha)) return { error: "La fecha no es válida." };
  if (link && !/^https?:\/\//i.test(link)) return { error: "El link del comprobante debe empezar con https://" };

  const tipoRaw = text(formData, "tipo");
  const tipo = TIPOS_GASTO.includes(tipoRaw as typeof TIPOS_GASTO[number]) ? tipoRaw : tipoRaw || null;

  const supabase = await createClient();
  const { error } = await supabase.from("gastos").insert({
    causa_id: causaId,
    descripcion,
    monto: monto ?? 0,
    fecha: fecha || undefined,
    tipo,
    comprobante_url: link,
  });

  if (error) return { error: `No se pudo guardar el gasto: ${error.message}` };
  refresh();
  return { message: "Gasto registrado." };
}

export async function removeGasto(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("gastos").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar el gasto: ${error.message}` };
  if (!data || data.length === 0) return { error: "Solo quien registró el gasto puede eliminarlo." };
  refresh();
  return { message: "Gasto eliminado." };
}

export { TIPOS_GASTO };
