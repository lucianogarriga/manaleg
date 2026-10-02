import { createClient } from "./server";
import type { Evento, TipoEvento } from "@/types";

export interface EventoInput {
  titulo: string;
  tipo: TipoEvento;
  fecha: string;
  hora?: string | null;
  lugar?: string | null;
  notas?: string | null;
}

export async function getEventosByCausa(causaId: string): Promise<Evento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("causa_id", causaId)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los eventos: ${error.message}`);
  return data ?? [];
}

// Próximos eventos de todas las causas accesibles (para dashboard y layoutCounts)
export async function getProximosEventos(dias = 30): Promise<(Evento & { caratula: string })[]> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const hasta = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("eventos")
    .select("*, causa:causas(caratula)")
    .gte("fecha", hoy)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(50)
    .returns<(Evento & { causa: { caratula: string } | null })[]>();

  if (error) throw new Error(`No se pudieron cargar los eventos próximos: ${error.message}`);
  return (data ?? []).map((e) => ({ ...e, caratula: e.causa?.caratula ?? "—" }));
}

export async function createEvento(causaId: string, input: EventoInput): Promise<Evento> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .insert({ causa_id: causaId, ...input })
    .select()
    .single();

  if (error) throw new Error(`No se pudo crear el evento: ${error.message}`);
  return data;
}

export async function updateEvento(id: string, input: Partial<EventoInput>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("eventos").update(input).eq("id", id);
  if (error) throw new Error(`No se pudo actualizar el evento: ${error.message}`);
}

export async function deleteEvento(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar el evento: ${error.message}`);
}
