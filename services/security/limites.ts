import { headers } from "next/headers";
import { createClient } from "@/services/supabase/server";

// true si la acción está dentro del límite. Si la base no responde, deja pasar
// el pedido (no bloquear a todos por un fallo técnico) y lo registra en el log.
export async function dentroDelLimite(clave: string, max: number, ventanaSeg: number): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consumir_limite", {
    p_clave: clave,
    p_max: max,
    p_ventana_seg: ventanaSeg,
  });
  if (error) {
    console.error("[limites] no se pudo consultar el contador:", error.message);
    return true;
  }
  return data === true;
}

export async function ipCliente(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
}
