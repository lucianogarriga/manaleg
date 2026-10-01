"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { isISODate, oneOf, text } from "@/utils/formData";
import { addDaysISO } from "@/utils/formatters";
import type { FormState } from "@/types";

const TIPOS_PROPIOS = ["Feria judicial", "Día inhábil"] as const;
const MAX_DIAS = 62; // un rango de feria judicial largo entra sobrado

// Carga un día inhábil propio (o un rango, ej. feria judicial de invierno).
// Cada día del rango queda como un registro; los ya cargados se ignoran.
export async function addDiaInhabil(_prev: FormState, formData: FormData): Promise<FormState> {
  const desde = text(formData, "desde");
  const hasta = text(formData, "hasta") ?? desde;
  const descripcion = text(formData, "descripcion");
  const tipo = oneOf(text(formData, "tipo"), TIPOS_PROPIOS) ?? "Día inhábil";

  if (!isISODate(desde) || !isISODate(hasta)) return { error: "Indicá la fecha del día inhábil." };
  if (hasta < desde) return { error: "La fecha “hasta” no puede ser anterior a “desde”." };
  if (!descripcion) return { error: "Escribí una descripción (ej. Feria judicial de invierno)." };

  const fechas: string[] = [];
  for (let d = desde; d <= hasta; d = addDaysISO(d, 1)) {
    fechas.push(d);
    if (fechas.length > MAX_DIAS) return { error: `El rango no puede superar ${MAX_DIAS} días.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("dias_inhabiles")
    .upsert(
      fechas.map((fecha) => ({ fecha, descripcion, tipo })),
      { onConflict: "user_id,fecha", ignoreDuplicates: true },
    );
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/", "layout");
  return { message: fechas.length === 1 ? "Día inhábil cargado." : `${fechas.length} días inhábiles cargados.` };
}

export async function removeDiaInhabil(id: string): Promise<FormState> {
  const supabase = await createClient();
  // RLS: solo se pueden borrar los propios (los feriados del sistema no)
  const { data, error } = await supabase.from("dias_inhabiles").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar: ${error.message}` };
  if (!data || data.length === 0) return { error: "Los feriados nacionales no se pueden eliminar." };

  revalidatePath("/", "layout");
  return { message: "Día inhábil eliminado." };
}
