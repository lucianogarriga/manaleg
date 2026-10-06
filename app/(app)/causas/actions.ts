"use server";

import { revalidatePath } from "next/cache";
import { createCausa, deleteCausa, updateCausa } from "@/services/supabase/causas";
import { createClient } from "@/services/supabase/server";
import { ANTICIPACION_ALERTA, ESTADOS_CAUSA, FUEROS, TIPOS_AVISO, VIAS_PROCESO } from "@/utils/constants";
import { oneOf, parseMonto, text } from "@/utils/formData";
import type { CausaInput, FormState } from "@/types";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export interface CausaFormState extends FormState {
  savedId?: string; // id de la causa creada/editada, para seleccionarla
}

function parseCausa(formData: FormData): { input?: CausaInput; error?: string } {
  const caratula = text(formData, "caratula");
  if (!caratula) return { error: "La carátula es obligatoria." };
  if (caratula.length > 80) return { error: "La carátula es demasiado larga (máx. 80 caracteres)." };

  const monto = parseMonto(text(formData, "monto_reclamado"));
  if (monto === "invalid") return { error: "El monto reclamado no es un número válido." };

  const inactividad = Number(text(formData, "inactividad_dias") ?? 7);
  if (!Number.isInteger(inactividad) || inactividad < 1 || inactividad > 365)
    return { error: "Los días de inactividad deben estar entre 1 y 365." };

  const proximoVencimiento = text(formData, "proximo_vencimiento");
  const motivoVencimiento = text(formData, "motivo_vencimiento");
  if (motivoVencimiento && motivoVencimiento.length > 100) return { error: "El motivo del vencimiento es demasiado largo (máx. 100 caracteres)." };

  const nroExpediente = text(formData, "nro_expediente");
  if (nroExpediente && nroExpediente.length > 60) return { error: "El número de expediente es demasiado largo (máx. 60 caracteres)." };

  const tipoJuicio = text(formData, "tipo_juicio");
  if (tipoJuicio && tipoJuicio.length > 50) return { error: "El tipo de juicio es demasiado largo (máx. 50 caracteres)." };

  const juzgadoCamara = text(formData, "juzgado_camara");
  if (juzgadoCamara && juzgadoCamara.length > 50) return { error: "El juzgado/cámara es demasiado largo (máx. 50 caracteres)." };

  const parteActora = text(formData, "parte_actora");
  if (parteActora && parteActora.length > 100) return { error: "La parte actora es demasiado larga (máx. 100 caracteres)." };

  const parteDemandada = text(formData, "parte_demandada");
  if (parteDemandada && parteDemandada.length > 100) return { error: "La parte demandada es demasiado larga (máx. 100 caracteres)." };

  const notas = text(formData, "notas");
  if (notas && notas.length > 500) return { error: "Las notas son demasiado largas (máx. 500 caracteres)." };

  const link = text(formData, "link_drive");
  if (link && !/^https?:\/\//i.test(link))
    return { error: "El link de Drive debe empezar con https://" };

  return {
    input: {
      caratula,
      nro_expediente: nroExpediente,
      fuero: oneOf(text(formData, "fuero"), FUEROS),
      tipo_juicio: tipoJuicio,
      juzgado_camara: juzgadoCamara,
      parte_actora: parteActora,
      parte_demandada: parteDemandada,
      cliente_id: text(formData, "cliente_id"),
      estado: oneOf(text(formData, "estado"), ESTADOS_CAUSA) ?? "Iniciada",
      via_proceso: oneOf(text(formData, "via_proceso"), VIAS_PROCESO),
      fecha_inicio: text(formData, "fecha_inicio"),
      proximo_vencimiento: proximoVencimiento,
      tipo_vencimiento: proximoVencimiento
        ? (oneOf(text(formData, "tipo_vencimiento"), TIPOS_AVISO) ?? "Vencimiento")
        : null,
      motivo_vencimiento: proximoVencimiento ? motivoVencimiento : null,
      anticipacion_alerta: oneOf(text(formData, "anticipacion_alerta"), ANTICIPACION_ALERTA) ?? "1 día",
      inactividad_dias: inactividad,
      monto_reclamado: monto,
      link_drive: link,
      notas,
    },
  };
}

export async function saveCausa(_prev: CausaFormState, formData: FormData): Promise<CausaFormState> {
  if (!await requireUser()) return { error: "No autenticado." };

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
  if (!await requireUser()) return { error: "No autenticado." };

  const { data, error } = await deleteCausa(id);

  if (error) return { error: `No se pudo eliminar la causa: ${error.message}` };
  if (!data || data.length === 0) return { error: "Solo el titular puede eliminar la causa." };

  revalidatePath("/", "layout");
  return { message: "Causa eliminada." };
}
