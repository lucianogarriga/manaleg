"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { claveRubro, type EstadoOP, type Imputacion, type RubroLiquidacion } from "@/utils/liquidaciones";

type Resultado = { error?: string; message?: string };

const esFecha = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const redondear = (n: number) => Math.round(n * 100) / 100;
const esMonto = (n: number) => Number.isFinite(n) && n > 0;

export interface LiquidacionInput {
  id?: string;
  causaId: string;
  fecha: string;
  descripcion: string;
  aprobada: boolean;
  fechaAprobacion: string;
  rubros: RubroLiquidacion[];
}

export interface OrdenPagoInput {
  id?: string;
  causaId: string;
  numero: string;
  fecha: string;
  monto: number;
  beneficiario: string;
  estado: EstadoOP;
  imputaciones: Imputacion[];
}

export async function guardarLiquidacion(input: LiquidacionInput): Promise<Resultado> {
  if (!esFecha(input.fecha)) return { error: "La fecha de la planilla no es válida." };
  if (input.aprobada && !esFecha(input.fechaAprobacion)) return { error: "Indicá la fecha de aprobación." };

  if (input.rubros.length === 0) return { error: "Agregá al menos un rubro." };
  const nombres = new Set<string>();
  for (const r of input.rubros) {
    const nombre = r.nombre.trim();
    if (!nombre) return { error: "Todos los rubros necesitan un nombre." };
    if (!esMonto(r.monto)) return { error: `El monto de «${nombre}» tiene que ser mayor a cero.` };
    const clave = claveRubro(nombre);
    if (nombres.has(clave)) return { error: `El rubro «${nombre}» está repetido.` };
    nombres.add(clave);
  }

  const supabase = await createClient();
  const payload = {
    causa_id: input.causaId,
    fecha: input.fecha,
    descripcion: input.descripcion.trim() || null,
    rubros: input.rubros.map((r) => ({ nombre: r.nombre.trim(), monto: redondear(r.monto) })),
    aprobada: input.aprobada,
    fecha_aprobacion: input.aprobada ? input.fechaAprobacion : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await supabase.from("liquidaciones").update(payload).eq("id", input.id)
    : await supabase.from("liquidaciones").insert(payload);
  if (error) return { error: `No se pudo guardar la liquidación: ${error.message}` };

  revalidatePath(`/causas/${input.causaId}`);
  return { message: input.id ? "Liquidación actualizada." : "Liquidación guardada." };
}

export async function eliminarLiquidacion(id: string, causaId: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("liquidaciones").delete().eq("id", id);
  if (error) return { error: `No se pudo eliminar: ${error.message}` };
  revalidatePath(`/causas/${causaId}`);
  return { message: "Liquidación eliminada." };
}

export async function guardarOrdenPago(input: OrdenPagoInput): Promise<Resultado> {
  const numero = input.numero.trim();
  if (!numero) return { error: "Indicá el número de la orden de pago." };
  if (!esFecha(input.fecha)) return { error: "La fecha de la orden de pago no es válida." };
  if (!esMonto(input.monto)) return { error: "El monto de la orden de pago tiene que ser mayor a cero." };
  if (input.estado !== "Librada" && input.estado !== "Procesada") return { error: "Estado no válido." };

  let imputado = 0;
  for (const imp of input.imputaciones) {
    if (!imp.rubro.trim()) return { error: "Cada imputación necesita un rubro." };
    if (!esMonto(imp.monto)) return { error: `La imputación a «${imp.rubro}» tiene que ser mayor a cero.` };
    imputado += imp.monto;
  }
  if (redondear(imputado) > redondear(input.monto)) {
    return { error: "Lo imputado a los rubros supera el monto de la orden de pago." };
  }

  const supabase = await createClient();
  const payload = {
    causa_id: input.causaId,
    numero,
    fecha: input.fecha,
    monto: redondear(input.monto),
    beneficiario: input.beneficiario.trim() || null,
    estado: input.estado,
    imputaciones: input.imputaciones.map((i) => ({ rubro: i.rubro.trim(), monto: redondear(i.monto) })),
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await supabase.from("ordenes_pago").update(payload).eq("id", input.id)
    : await supabase.from("ordenes_pago").insert(payload);
  if (error) return { error: `No se pudo guardar la orden de pago: ${error.message}` };

  revalidatePath(`/causas/${input.causaId}`);
  return { message: input.id ? "Orden de pago actualizada." : "Orden de pago guardada." };
}

export async function eliminarOrdenPago(id: string, causaId: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("ordenes_pago").delete().eq("id", id);
  if (error) return { error: `No se pudo eliminar: ${error.message}` };
  revalidatePath(`/causas/${causaId}`);
  return { message: "Orden de pago eliminada." };
}
