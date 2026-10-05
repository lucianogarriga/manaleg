"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { TIPOS_MOVIMIENTO } from "@/utils/constants";
import { isISODate, oneOf, parseMonto, text } from "@/utils/formData";
import { todayISO } from "@/utils/formatters";
import type { FormState } from "@/types";

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
  const { error } = id
    ? await supabase.from("honorarios").update(values).eq("id", id)
    : await supabase.from("honorarios").insert({ causa_id: causaId, ...values });

  if (error) return { error: `No se pudieron guardar los honorarios: ${error.message}` };

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

  if (!causaId || !honorarioId) return { error: "Faltan los honorarios de la causa." };
  if (monto === null || monto === "invalid" || monto <= 0) return { error: "Ingresá un monto mayor a 0." };
  if (!isISODate(fecha)) return { error: "La fecha del pago no es válida." };
  if (link && !/^https?:\/\//i.test(link)) return { error: "El link del comprobante debe empezar con https://" };

  const supabase = await createClient();
  const { error } = await supabase.from("pagos").insert({
    causa_id: causaId,
    honorario_id: honorarioId,
    fecha_pago: fecha,
    monto,
    descripcion: text(formData, "descripcion"),
    comprobante_drive: link,
  });
  if (error) return { error: `No se pudo registrar el pago: ${error.message}` };

  refresh();
  return { message: "Pago registrado." };
}

export async function removePago(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pagos").delete().eq("id", id).select("id");
  if (error) return { error: `No se pudo eliminar el pago: ${error.message}` };
  if (!data || data.length === 0) return { error: "No se pudo eliminar el pago." };

  refresh();
  return { message: "Pago eliminado." };
}
