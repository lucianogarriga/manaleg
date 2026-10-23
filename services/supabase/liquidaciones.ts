import { createClient } from "./server";
import type { EstadoOP, Imputacion, Liquidacion, OrdenPago, RubroLiquidacion } from "@/utils/liquidaciones";

// Liquidaciones y órdenes de pago de una causa. Los montos numeric llegan como texto desde Postgres: se convierten.
export async function getFinanzasJudiciales(causaId: string): Promise<{ liquidaciones: Liquidacion[]; ordenes: OrdenPago[] }> {
  const supabase = await createClient();
  const [liq, ops] = await Promise.all([
    supabase
      .from("liquidaciones")
      .select("id, causa_id, fecha, descripcion, rubros, aprobada, fecha_aprobacion")
      .eq("causa_id", causaId)
      .order("fecha", { ascending: false })
      .returns<Liquidacion[]>(),
    supabase
      .from("ordenes_pago")
      .select("id, causa_id, numero, fecha, monto, beneficiario, estado, imputaciones")
      .eq("causa_id", causaId)
      .order("fecha", { ascending: false })
      .returns<(Omit<OrdenPago, "monto"> & { monto: number | string })[]>(),
  ]);
  if (liq.error) throw new Error(`No se pudieron cargar las liquidaciones: ${liq.error.message}`);
  if (ops.error) throw new Error(`No se pudieron cargar las órdenes de pago: ${ops.error.message}`);

  return {
    liquidaciones: (liq.data ?? []).map((l) => ({
      ...l,
      rubros: (l.rubros as RubroLiquidacion[]).map((r) => ({ nombre: r.nombre, monto: Number(r.monto) })),
    })),
    ordenes: (ops.data ?? []).map((o) => ({
      ...o,
      monto: Number(o.monto),
      estado: o.estado as EstadoOP,
      imputaciones: (o.imputaciones as Imputacion[]).map((i) => ({ rubro: i.rubro, monto: Number(i.monto) })),
    })),
  };
}
