import { createClient } from "./server";
import type { Cliente } from "@/types";

export type ClienteOption = Pick<Cliente, "id" | "nombre_completo">;

// Opciones para el select de cliente en el formulario de causa
export async function getClienteOptions(): Promise<ClienteOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre_completo")
    .order("nombre_completo")
    .returns<ClienteOption[]>();

  if (error) throw new Error(`No se pudieron cargar los clientes: ${error.message}`);
  return data;
}
