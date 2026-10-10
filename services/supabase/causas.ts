import { createClient } from "./server";
import type { AlertaItem } from "./layoutCounts";
import type { CausaConRelaciones, CausaInput, CausaParte } from "@/types";
import { CAUSAS_LIMIT } from "@/utils/constants";

// RLS devuelve solo causas propias + compartidas: no filtrar por user_id acá.
const CAUSA_SELECT = `
  *,
  owner:profiles!causas_user_id_fkey(id, nombre_completo, email),
  editor:profiles!causas_ultimo_editor_id_fkey(id, nombre_completo, email),
  cliente:clientes(id, nombre_completo),
  causa_shares(id),
  causa_partes(id, nombre, tipo_persona, rol, es_nuestra_parte, caracter_abogado, orden)
`;

export type GetCausasResult = { causas: CausaConRelaciones[]; totalEnBD: number };

export async function getCausas(): Promise<GetCausasResult> {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("causas")
    .select(CAUSA_SELECT, { count: "exact" })
    .order("proximo_vencimiento", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(CAUSAS_LIMIT)
    .returns<CausaConRelaciones[]>();

  if (error) throw new Error(`No se pudieron cargar las causas: ${error.message}`);
  return { causas: data, totalEnBD: count ?? data.length };
}

type AvisoRow = {
  id: string;
  caratula: string;
  proximo_vencimiento: string;
  tipo_vencimiento: AlertaItem["tipo"];
  motivo_vencimiento: string | null;
};

// Próxima alerta o vencimiento de cada causa abierta (para el calendario)
export async function getAvisosCausas(): Promise<AlertaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causas")
    .select("id, caratula, proximo_vencimiento, tipo_vencimiento, motivo_vencimiento")
    .neq("estado", "Cerrada")
    .not("proximo_vencimiento", "is", null)
    .order("proximo_vencimiento", { ascending: true })
    .returns<AvisoRow[]>();

  if (error) throw new Error(`No se pudieron cargar los vencimientos: ${error.message}`);
  return data.map((c) => ({
    causaId: c.id,
    caratula: c.caratula,
    fecha: c.proximo_vencimiento,
    tipo: c.tipo_vencimiento,
    motivo: c.motivo_vencimiento,
  }));
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

  // Verificar límite del plan antes de insertar
  const [countResult, profileResult] = await Promise.all([
    supabase.from("causas").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("causas_max").single<{ causas_max: number }>(),
  ]);

  const total = countResult.count ?? 0;
  const max = profileResult.data?.causas_max ?? 100;

  if (total >= max) {
    return {
      data: null,
      error: {
        message: `Alcanzaste el límite de ${max} causas de tu plan actual. Contactá al equipo de MANALEG para ampliar tu límite.`,
      },
    } as const;
  }

  return supabase.from("causas").insert(input).select("id").single<{ id: string }>();
}

export async function updateCausa(id: string, input: CausaInput) {
  const supabase = await createClient();
  return supabase.from("causas").update({ ...input, campo_editado: "Actualizó datos del expediente" }).eq("id", id).select("id").single<{ id: string }>();
}

export async function deleteCausa(id: string) {
  const supabase = await createClient();
  // RLS: solo el owner puede borrar. Si no es owner, no borra ninguna fila.
  return supabase.from("causas").delete().eq("id", id).select("id");
}

type ParteRow = Omit<CausaParte, "id" | "created_at">;

export async function saveCausaPartes(causaId: string, partes: Omit<ParteRow, "causa_id">[]) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("causa_partes")
    .delete()
    .eq("causa_id", causaId);
  if (deleteError) return { error: deleteError };

  if (partes.length === 0) return { error: null };

  const rows = partes.map((p) => ({ ...p, causa_id: causaId }));
  const { error } = await supabase.from("causa_partes").insert(rows);
  return { error };
}
