import { createClient } from "./server";
import type { TipoAviso, EstadoCausa } from "@/types";

export interface VencimientoItem {
  causaId: string;
  caratula: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoAviso | null;
  motivo: string | null;
  estado: EstadoCausa;
}

// Todas las causas con vencimiento cargado, ordenadas por fecha.
// Incluye vencidas y futuras; RLS limita a las accesibles por el usuario.
export async function getAllVencimientos(): Promise<VencimientoItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causas")
    .select("id, caratula, proximo_vencimiento, tipo_vencimiento, motivo_vencimiento, estado")
    .not("proximo_vencimiento", "is", null)
    .order("proximo_vencimiento", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los vencimientos: ${error.message}`);

  return (data ?? []).map((c) => ({
    causaId: c.id,
    caratula: c.caratula,
    fecha: c.proximo_vencimiento as string,
    tipo: c.tipo_vencimiento,
    motivo: c.motivo_vencimiento,
    estado: c.estado,
  }));
}
