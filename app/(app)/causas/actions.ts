"use server";

import { revalidatePath } from "next/cache";
import { createCausa, deleteCausa, updateCausa } from "@/services/supabase/causas";
import { ANTICIPACION_ALERTA, ESTADOS_CAUSA, FUEROS, TIPOS_AVISO, VIAS_PROCESO } from "@/utils/constants";
import { oneOf, parseMonto, text } from "@/utils/formData";
import type { CausaInput, FormState } from "@/types";

export interface CausaFormState extends FormState {
  savedId?: string; // id de la causa creada/editada, para seleccionarla
}

function parseCausa(formData: FormData): { input?: CausaInput; error?: string } {
  const caratula = text(formData, "caratula");
  if (!caratula) return { error: "La carátula es obligatoria." };

  const monto = parseMonto(text(formData, "monto_reclamado"));
  if (monto === "invalid") return { error: "El monto reclamado no es un número válido." };

  const inactividad = Number(text(formData, "inactividad_dias") ?? 7);
  if (!Number.isInteger(inactividad) || inactividad < 1)
    return { error: "Los días de inactividad deben ser un número entero mayor a 0." };

  const proximoVencimiento = text(formData, "proximo_vencimiento");

  const link = text(formData, "link_drive");
  if (link && !/^https?:\/\//i.test(link))
    return { error: "El link de Drive debe empezar con https://" };

  return {
    input: {
      caratula,
      nro_expediente: text(formData, "nro_expediente"),
      fuero: oneOf(text(formData, "fuero"), FUEROS),
      tipo_juicio: text(formData, "tipo_juicio"),
      juzgado_camara: text(formData, "juzgado_camara"),
      parte_actora: text(formData, "parte_actora"),
      parte_demandada: text(formData, "parte_demandada"),
      cliente_id: text(formData, "cliente_id"),
      estado: oneOf(text(formData, "estado"), ESTADOS_CAUSA) ?? "Iniciada",
      via_proceso: oneOf(text(formData, "via_proceso"), VIAS_PROCESO),
      fecha_inicio: text(formData, "fecha_inicio"),
      proximo_vencimiento: proximoVencimiento,
      tipo_vencimiento: proximoVencimiento
        ? (oneOf(text(formData, "tipo_vencimiento"), TIPOS_AVISO) ?? "Vencimiento")
        : null,
      motivo_vencimiento: proximoVencimiento ? text(formData, "motivo_vencimiento") : null,
      anticipacion_alerta: oneOf(text(formData, "anticipacion_alerta"), ANTICIPACION_ALERTA) ?? "1 día",
      inactividad_dias: inactividad,
      monto_reclamado: monto,
      link_drive: link,
      notas: text(formData, "notas"),
    },
  };
}

export async function saveCausa(_prev: CausaFormState, formData: FormData): Promise<CausaFormState> {
  const id = text(formData, "id");
  const { input, error } = parseCausa(formData);
  if (!input) return { error };

  const result = id ? await updateCausa(id, input) : await createCausa(input);

  if (result.error || !result.data) {
    return { error: `No se pudo guardar la causa: ${result.error?.message ?? "sin respuesta"}` };
  }

  revalidatePath("/", "layout"); // refresca lista + contadores del sidebar
  return { savedId: result.data.id, message: id ? "Causa actualizada." : "Causa creada." };
}

export async function removeCausa(id: string): Promise<FormState> {
  const { data, error } = await deleteCausa(id);

  if (error) return { error: `No se pudo eliminar la causa: ${error.message}` };
  if (!data || data.length === 0) return { error: "Solo el titular puede eliminar la causa." };

  revalidatePath("/", "layout");
  return { message: "Causa eliminada." };
}
