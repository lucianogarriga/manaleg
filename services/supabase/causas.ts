import { createClient } from "./server";
import type { AlertaItem } from "./layoutCounts";
import type { CausaConRelaciones, CausaInput } from "@/types";

// RLS devuelve solo causas propias + compartidas: no filtrar por user_id acá.
const CAUSA_SELECT = `
  *,
  owner:profiles!causas_user_id_fkey(id, nombre_completo, email),
  editor:profiles!causas_ultimo_editor_id_fkey(id, nombre_completo, email),
  cliente:clientes(id, nombre_completo),
  causa_shares(id)
`;

// Límite conservador mientras no exista paginación del lado del servidor.
// Un abogado con > 500 causas activas necesitará paginación real (TODO).
const CAUSAS_LIMIT = 500;

export async function getCausas(): Promise<CausaConRelaciones[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causas")
    .select(CAUSA_SELECT)
    .order("proximo_vencimiento", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(CAUSAS_LIMIT)
    .returns<CausaConRelaciones[]>();

  if (error) throw new Error(`No se pudieron cargar las causas: ${error.message}`);
  return data;
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
  return supabase.from("causas").update(input).eq("id", id).select("id").single<{ id: string }>();
}

export async function deleteCausa(id: string) {
  const supabase = await createClient();
  // RLS: solo el owner puede borrar. Si no es owner, no borra ninguna fila.
  return supabase.from("causas").delete().eq("id", id).select("id");
}
