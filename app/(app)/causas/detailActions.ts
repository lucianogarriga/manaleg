"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { TIPOS_MOVIMIENTO } from "@/utils/constants";
import { isISODate, oneOf, parseMonto, text } from "@/utils/formData";
import { todayISO } from "@/utils/formatters";
import type { FormState } from "@/types";
import { monedaDeHonorario } from "@/utils/honorarios";

async function getAuthUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Acciones sobre los datos de una causa: movimientos, honorarios y pagos.
// RLS valida el acceso a la causa; acá se valida el formato de los datos.

const refresh = () => revalidatePath("/", "layout");
// Honorarios y pagos no afectan al layout (alertas, contadores): basta con las páginas que los muestran.
const refreshFinanzas = () => {
  revalidatePath("/honorarios");
  revalidatePath("/", "page");
};

// ─── MOVIMIENTOS ───

export async function createMovimiento(_prev: FormState, formData: FormData): Promise<FormState> {
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

export async function updateMovimiento(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const descripcion = text(formData, "descripcion");
  const fecha = text(formData, "fecha");

  if (!id) return { error: "Falta el id del movimiento." };
  if (!descripcion) return { error: "Escribí la descripción del movimiento." };
  if (descripcion.length > 2000) return { error: "La descripción es demasiado larga (máx. 2000 caracteres)." };
  if (fecha && !isISODate(fecha)) return { error: "La fecha no es válida." };

  const updates: { tipo: string | null; descripcion: string; fecha?: string } = {
    tipo: oneOf(text(formData, "tipo"), TIPOS_MOVIMIENTO),
    descripcion,
  };
  if (fecha && fecha !== todayISO()) updates.fecha = `${fecha}T12:00:00-03:00`;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movimientos")
    .update(updates)
    .eq("id", id)
    .select("id");

  if (error) return { error: `No se pudo actualizar el movimiento: ${error.message}` };
  if (!data || data.length === 0) return { error: "Solo quien cargó el movimiento puede editarlo." };

  refresh();
  return { message: "Movimiento actualizado." };
}

export async function deleteMovimiento(id: string): Promise<FormState> {
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
  const moneda = monedaDeHonorario(text(formData, "moneda"));
  const montoAdicionalRaw = text(formData, "monto_adicional");
  const notasHonorarios = text(formData, "notas_honorarios") || null;
  const conceptoElegido = text(formData, "concepto");
  const concepto = conceptoElegido === "Otro" ? text(formData, "concepto_otro") : conceptoElegido;
  const periodicidad = text(formData, "periodicidad") === "mensual" ? "mensual" : "unico";
  const cuotasRaw = text(formData, "cuotas_mensuales");

  if (!causaId) return { error: "Falta la causa." };
  if (!concepto) return { error: "Elegí o escribí el concepto del honorario." };
  if (concepto.length > 80) return { error: "El concepto es demasiado largo (máx. 80 caracteres)." };
  if (notasHonorarios && notasHonorarios.length > 500) return { error: "Las notas son demasiado largas (máx. 500 caracteres)." };

  let cuotasMensuales: number | null = null;
  if (periodicidad === "mensual" && cuotasRaw) {
    cuotasMensuales = Number(cuotasRaw);
    if (!Number.isInteger(cuotasMensuales) || cuotasMensuales < 1 || cuotasMensuales > 600)
      return { error: "La cantidad de cuotas debe ser un número entero entre 1 y 600." };
  }
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

  const values = {
    concepto,
    periodicidad,
    cuotas_mensuales: periodicidad === "mensual" ? cuotasMensuales : null,
    monto_acordado: monto,
    porcentaje,
    fecha_pacto: fechaPacto,
    moneda,
    monto_adicional,
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

  refreshFinanzas();
  return { message: id ? "Honorarios actualizados." : "Honorarios definidos." };
}

export async function deleteHonorario(id: string): Promise<FormState> {
  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("honorarios").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar el honorario: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se encontró el honorario o no tenés acceso." };

  refreshFinanzas();
  return { message: "Honorario eliminado." };
}

async function anular(tabla: "honorarios" | "pagos", id: string, motivo: string | null): Promise<FormState> {
  if (!await getAuthUserId()) return { error: "No autenticado." };
  if (!motivo) return { error: "Escribí el motivo de la anulación." };
  if (motivo.length > 500) return { error: "El motivo es demasiado largo (máx. 500 caracteres)." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(tabla)
    .update({ anulado: true, motivo_anulacion: motivo })
    .eq("id", id)
    .select("id");
  if (error) return { error: `No se pudo anular: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se encontró el registro o no tenés permiso para anularlo." };

  refreshFinanzas();
  return { message: tabla === "pagos" ? "Pago anulado." : "Honorario anulado." };
}

export async function anularHonorario(id: string, motivo: string | null): Promise<FormState> {
  return anular("honorarios", id, motivo);
}

export async function anularPago(id: string, motivo: string | null): Promise<FormState> {
  return anular("pagos", id, motivo);
}

// ─── PAGOS ───

export async function createPago(_prev: FormState, formData: FormData): Promise<FormState> {
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

  refreshFinanzas();
  return { message: "Pago registrado." };
}

// ─── VENCIMIENTOS ───

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

const ESTADOS_AUDIENCIA = ["Programada", "Celebrada", "Suspendida", "Reprogramada"] as const;

function extraCampos(tipo: string, formData: FormData) {
  if (tipo === "Audiencia") {
    return {
      hora: text(formData, "hora") || null,
      lugar: text(formData, "lugar") || null,
      notas: text(formData, "notas") || null,
      acto_procesal: null,
      estado_audiencia: ESTADOS_AUDIENCIA.includes(text(formData, "estado_audiencia") as typeof ESTADOS_AUDIENCIA[number])
        ? text(formData, "estado_audiencia")
        : "Programada",
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

export async function createVencimiento(_prev: FormState, formData: FormData): Promise<FormState> {
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

export async function updateVencimiento(_prev: FormState, formData: FormData): Promise<FormState> {
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

export async function deleteVencimiento(id: string): Promise<FormState> {
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

export async function deletePago(id: string): Promise<FormState> {
  if (!await getAuthUserId()) return { error: "No autenticado." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("pagos").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar el pago: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se pudo eliminar el pago." };

  refreshFinanzas();
  return { message: "Pago eliminado." };
}
