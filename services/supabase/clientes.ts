import { createClient } from "./server";
import type { Cliente } from "@/types";

export type ClienteOption = Pick<Cliente, "id" | "nombre_completo">;
export type ClienteInput = Pick<Cliente, "nombre_completo" | "dni_cuit" | "telefono" | "email" | "notas">;

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

export async function getClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre_completo")
    .returns<Cliente[]>();

  if (error) throw new Error(`No se pudieron cargar los clientes: ${error.message}`);
  return data;
}

export async function createCliente(input: ClienteInput) {
  const supabase = await createClient();
  return supabase.from("clientes").insert(input).select("id").single<{ id: string }>();
}

export async function updateCliente(id: string, input: ClienteInput) {
  const supabase = await createClient();
  return supabase.from("clientes").update(input).eq("id", id).select("id").single<{ id: string }>();
}

export async function deleteCliente(id: string) {
  const supabase = await createClient();
  return supabase.from("clientes").delete().eq("id", id).select("id");
}
