import { createClient } from "./server";
import type { AlertaItem } from "./layoutCounts";

// Tareas pendientes con fecha límite, para mostrarlas en el calendario junto a los vencimientos.
export async function getTareasCalendario(): Promise<AlertaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select("id, texto, fecha_limite, causa:causas(id, caratula)")
    .not("fecha_limite", "is", null)
    .eq("completado", false)
    .order("fecha_limite", { ascending: true })
    .limit(500)
    .returns<{ id: string; texto: string; fecha_limite: string; causa: { id: string; caratula: string } | null }[]>();
  if (error) {
    console.error("[getTareasCalendario]", error.message);
    return [];
  }
  return (data ?? []).map((t) => ({
    causaId: t.causa?.id ?? "",
    caratula: t.causa?.caratula ?? "Tarea sin causa",
    fecha: t.fecha_limite,
    tipo: null,
    motivo: t.texto,
    esTarea: true,
  }));
}
