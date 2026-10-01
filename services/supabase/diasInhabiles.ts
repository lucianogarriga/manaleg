import { createClient } from "./server";
import type { DiaInhabil } from "@/types";

// Feriados del sistema + días inhábiles propios (RLS ya limita a esos dos grupos)
export async function getDiasInhabiles(): Promise<DiaInhabil[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dias_inhabiles")
    .select("id, user_id, fecha, descripcion, tipo")
    .order("fecha", { ascending: true })
    .returns<DiaInhabil[]>();

  if (error) throw new Error(`No se pudieron cargar los días inhábiles: ${error.message}`);
  return data;
}
