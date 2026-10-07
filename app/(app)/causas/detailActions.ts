"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { TIPOS_MOVIMIENTO } from "@/utils/constants";
import { isISODate, oneOf, parseMonto, text } from "@/utils/formData";
import { todayISO } from "@/utils/formatters";
import type { FormState } from "@/types";

async function getAuthUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Acciones sobre los datos de una causa: movimientos, honorarios y pagos.
// RLS valida el acceso a la causa; acá se valida el formato de los datos.

const refresh = () => revalidatePath("/", "layout");

// ─── MOVIMIENTOS ───

export async function addMovimiento(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const descripcion = text(formData, "descripcion");
  const fecha = text(formData, "fecha");

  if (!causaId) return { error: "Falta la causa." };
  if (!descripcion) return { error: "Escribí la descripción del movimiento." };
  if (descripcion.length > 2000) return { error: "La descripción es demasiado larga (máx. 2000 caracteres)." };
  if (fecha && !isISODate(fecha)) return { error: "La fecha no es válida." };

  const row: { causa_id: string; tipo: string | null; descripcion: string; fecha?: string } = {
    causa_id: causaId,
    tipo: oneOf(text(formData, "tipo"), TIPOS_MOVIMIENTO),
    descripcion,
  };
  // Hoy → la base pone la hora actual. Otra fecha → mediodía (Argentina, UTC-3).
  if (fecha && fecha !== todayISO()) row.fecha = `${fecha}T12:00:00-03:00`;

  const supabase = await createClient();
  const { error } = await supabase.from("movimientos").insert(row);
  if (error) return { error: `No se pudo guardar el movimiento: ${error.message}` };

  refresh();
  return { message: "Movimiento agregado." };
}

export async function removeMovimiento(id: string): Promise<FormState> {
  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("movimientos").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar el movimiento: ${error.message}` };
  if (!data || data.length === 0) return { error: "Solo quien cargó el movimiento puede eliminarlo." };

  refresh();
  return { message: "Movimiento eliminado." };
}

// ─── HONORARIOS ───

export async function saveHonorario(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const causaId = text(formData, "causa_id");
  const monto = parseMonto(text(formData, "monto_acordado"));
  const porcentajeRaw = text(formData, "porcentaje");
  const fechaPacto = text(formData, "fecha_pacto");
  const moneda = text(formData, "moneda") === "USD" ? "USD" : "ARS";
  const montoAdicionalRaw = text(formData, "monto_adicional");
  const consultaCobrada = formData.get("consulta_cobrada") === "true";
  const montoConsultaRaw = text(formData, "monto_consulta");
  const notasHonorarios = text(formData, "notas_honorarios") || null;

  if (!causaId) return { error: "Falta la causa." };
  if (notasHonorarios && notasHonorarios.length > 500) return { error: "Las notas son demasiado largas (máx. 500 caracteres)." };
  if (monto === null || monto === "invalid") return { error: "Ingresá un monto acordado válido." };
  if (fechaPacto && !isISODate(fechaPacto)) return { error: "La fecha del pacto no es válida." };

  let porcentaje: number | null = null;
  if (porcentajeRaw) {
    porcentaje = Number(porcentajeRaw.replace(",", "."));
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100)
      return { error: "El porcentaje debe estar entre 0 y 100." };
  }

  let monto_adicional: number | null = null;
  if (montoAdicionalRaw) {
    const v = parseMonto(montoAdicionalRaw);
    if (v === "invalid" || (v !== null && v < 0)) return { error: "El monto adicional no es válido." };
    monto_adicional = v;
  }

  let monto_consulta: number | null = null;
  if (consultaCobrada && montoConsultaRaw) {
    const v = parseMonto(montoConsultaRaw);
    if (v === "invalid" || (v !== null && v < 0)) return { error: "El monto de consulta no es válido." };
    monto_consulta = v;
  }

  const values = {
    monto_acordado: monto,
    porcentaje,
    fecha_pacto: fechaPacto,
    moneda,
    monto_adicional,
    consulta_cobrada: consultaCobrada,
    monto_consulta: consultaCobrada ? monto_consulta : null,
    notas_honorarios: notasHonorarios,
  };
  const supabase = await createClient();
  if (id) {
    const { data, error } = await supabase.from("honorarios").update(values).eq("id", id).select("id");
    if (error) return { error: `No se pudieron guardar los honorarios: ${error.message}` };
    if (!data || data.length === 0) return { error: "No se encontraron los honorarios o no tenés acceso." };
  } else {
    const { error } = await supabase.from("honorarios").insert({ causa_id: causaId, ...values });
    if (error) return { error: `No se pudieron guardar los honorarios: ${error.message}` };
  }

  refresh();
  return { message: id ? "Honorarios actualizados." : "Honorarios definidos." };
}

// ─── PAGOS ───

export async function addPago(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const honorarioId = text(formData, "honorario_id");
  const monto = parseMonto(text(formData, "monto"));
  const fecha = text(formData, "fecha_pago") ?? todayISO();
  const link = text(formData, "comprobante_drive");

  const descPago = text(formData, "descripcion");

  if (!causaId || !honorarioId) return { error: "Faltan los honorarios de la causa." };
  if (monto === null || monto === "invalid" || monto <= 0) return { error: "Ingresá un monto mayor a 0." };
  if (!isISODate(fecha)) return { error: "La fecha del pago no es válida." };
  if (link && !/^https?:\/\//i.test(link)) return { error: "El link del comprobante debe empezar con https://" };
  if (descPago && descPago.length > 500) return { error: "La descripción es demasiado larga (máx. 500 caracteres)." };

  const supabase = await createClient();
  const { error } = await supabase.from("pagos").insert({
    causa_id: causaId,
    honorario_id: honorarioId,
    fecha_pago: fecha,
    monto,
    descripcion: descPago,
    comprobante_drive: link,
  });
  if (error) return { error: `No se pudo registrar el pago: ${error.message}` };

  refresh();
  return { message: "Pago registrado." };
}

// ─── VENCIMIENTOS ───

export async function updateVencimiento(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const proximoVencimiento = text(formData, "proximo_vencimiento");
  const motivo = text(formData, "motivo_vencimiento");
  const tipoRaw = text(formData, "tipo_vencimiento");

  if (!causaId) return { error: "Falta la causa." };
  if (proximoVencimiento && !isISODate(proximoVencimiento)) return { error: "La fecha no es válida." };

  const tipo = proximoVencimiento
    ? (["Vencimiento", "Recordatorio", "Audiencia"].includes(tipoRaw ?? "") ? tipoRaw : "Vencimiento")
    : null;

  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("causas").update({
    proximo_vencimiento: proximoVencimiento || null,
    motivo_vencimiento: proximoVencimiento ? motivo || null : null,
    tipo_vencimiento: tipo,
    campo_editado: "Actualizó próximo vencimiento",
  }).eq("id", causaId).select("id");

  if (error) return { error: `No se pudo actualizar el vencimiento: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se encontró la causa o no tenés acceso." };
  refresh();
  return { message: "Vencimiento actualizado." };
}

export async function clearVencimiento(causaId: string): Promise<FormState> {
  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("causas").update({
    proximo_vencimiento: null,
    motivo_vencimiento: null,
    tipo_vencimiento: null,
    campo_editado: "Limpió vencimiento",
  }).eq("id", causaId).select("id");

  if (error) return { error: `No se pudo eliminar el vencimiento: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se encontró la causa o no tenés acceso." };
  refresh();
  return { message: "Vencimiento eliminado." };
}

// ─── VENCIMIENTOS (tabla vencimientos) ───

const TIPOS_VENC = ["Vencimiento", "Audiencia", "Recordatorio"] as const;

function extraCampos(tipo: string, formData: FormData) {
  if (tipo === "Audiencia") {
    return {
      hora: text(formData, "hora") || null,
      lugar: text(formData, "lugar") || null,
      notas: text(formData, "notas") || null,
      acto_procesal: null,
    };
  }
  if (tipo === "Vencimiento") {
    return {
      hora: null,
      lugar: null,
      notas: null,
      acto_procesal: text(formData, "acto_procesal") || null,
    };
  }
  return { hora: null, lugar: null, notas: null, acto_procesal: null };
}

export async function createVencimientoRow(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const fecha = text(formData, "fecha");
  const motivo = text(formData, "motivo") || null;
  const tipoRaw = text(formData, "tipo");
  const anticipacion = text(formData, "anticipacion") || "1 día";

  if (!causaId) return { error: "Falta la causa." };
  if (!fecha || !isISODate(fecha)) return { error: "La fecha no es válida." };
  const tipo = TIPOS_VENC.includes(tipoRaw as typeof TIPOS_VENC[number]) ? tipoRaw! : "Vencimiento";

  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado." };

  const supabase = await createClient();
  const { error } = await supabase.from("vencimientos").insert({
    causa_id: causaId,
    creado_por_id: userId,
    tipo,
    fecha,
    motivo,
    anticipacion: tipo === "Recordatorio" ? "1 día" : anticipacion,
    ...extraCampos(tipo, formData),
  });
  if (error) return { error: `No se pudo crear el vencimiento: ${error.message}` };

  refresh();
  return { message: `${tipo} agregado.` };
}

export async function updateVencimientoRow(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const fecha = text(formData, "fecha");
  const motivo = text(formData, "motivo") || null;
  const tipoRaw = text(formData, "tipo");
  const anticipacion = text(formData, "anticipacion") || "1 día";

  if (!id) return { error: "Falta el id del vencimiento." };
  if (!fecha || !isISODate(fecha)) return { error: "La fecha no es válida." };
  const tipo = TIPOS_VENC.includes(tipoRaw as typeof TIPOS_VENC[number]) ? tipoRaw! : "Vencimiento";

  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("vencimientos").update({
    tipo, fecha, motivo,
    anticipacion: tipo === "Recordatorio" ? "1 día" : anticipacion,
    ...extraCampos(tipo, formData),
  }).eq("id", id).select("id");
  if (error) return { error: `No se pudo actualizar el vencimiento: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se encontró el vencimiento o no tenés acceso." };

  refresh();
  return { message: `${tipo} actualizado.` };
}

export async function deleteVencimientoRow(id: string): Promise<FormState> {
  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("vencimientos").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar el vencimiento: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se encontró el vencimiento o no tenés acceso." };

  refresh();
  return { message: "Vencimiento eliminado." };
}

export async function toggleVencimientoCompletado(id: string, completado: boolean): Promise<FormState> {
  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("vencimientos").update({ completado }).eq("id", id).select("id");
  if (error) return { error: `No se pudo actualizar el vencimiento: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se encontró el vencimiento o no tenés acceso." };

  refresh();
  return { message: completado ? "Marcado como completado." : "Marcado como pendiente." };
}

export async function removePago(id: string): Promise<FormState> {
  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("pagos").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar el pago: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se pudo eliminar el pago." };

  refresh();
  return { message: "Pago eliminado." };
}
