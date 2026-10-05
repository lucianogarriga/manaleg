import { createClient } from "./server";

export interface Gasto {
  id: string;
  causa_id: string;
  user_id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  tipo: string | null;
  comprobante_url: string | null;
  created_at: string;
}

export async function getGastos(causaId: string): Promise<Gasto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .eq("causa_id", causaId)
    .order("fecha", { ascending: false })
    .returns<Gasto[]>();
  if (error) throw new Error(`No se pudieron cargar los gastos: ${error.message}`);
  return data;
}
