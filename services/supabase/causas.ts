import { createClient } from "./server";
import type { CausaConRelaciones, CausaInput } from "@/types";

// RLS devuelve solo causas propias + compartidas: no filtrar por user_id acá.
const CAUSA_SELECT = `
  *,
  owner:profiles!causas_user_id_fkey(id, nombre_completo, email),
  editor:profiles!causas_ultimo_editor_id_fkey(id, nombre_completo, email),
  cliente:clientes(id, nombre_completo)
`;

export async function getCausas(): Promise<CausaConRelaciones[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causas")
    .select(CAUSA_SELECT)
    .order("proximo_vencimiento", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .returns<CausaConRelaciones[]>();

  if (error) throw new Error(`No se pudieron cargar las causas: ${error.message}`);
  return data;
}

export async function getCausaById(id: string): Promise<CausaConRelaciones | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causas")
    .select(CAUSA_SELECT)
    .eq("id", id)
    .maybeSingle<CausaConRelaciones>();

  if (error) throw new Error(`No se pudo cargar la causa: ${error.message}`);
  return data;
}

// user_id y ultimo_editor_id los completa la base (default auth.uid() / trigger)
export async function createCausa(input: CausaInput) {
  const supabase = await createClient();
  return supabase.from("causas").insert(input).select("id").single<{ id: string }>();
}

export async function updateCausa(id: string, input: CausaInput) {
  const supabase = await createClient();
  return supabase.from("causas").update(input).eq("id", id).select("id").single<{ id: string }>();
}

export async function deleteCausa(id: string) {
  const supabase = await createClient();
  // RLS: solo el owner puede borrar. Si no es owner, no borra ninguna fila.
  return supabase.from("causas").delete().eq("id", id).select("id");
}
