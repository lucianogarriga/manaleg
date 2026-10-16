"use server";

import { revalidatePath } from "next/cache";
import { aFilaCausa, analizarCsvCausas, type AnalisisCausas } from "@/services/csv/importarCausas";
import { createClient } from "@/services/supabase/server";

const MAX_BYTES = 1024 * 1024; // 1 MB

export interface VistaPreviaCausas extends AnalisisCausas {
  error?: string;
  causasMax?: number;
  causasPropias?: number;
}

// Lee el archivo, valida el tamaño y arma el análisis con los expedientes que el usuario ya tiene.
async function analizarArchivo(formData: FormData): Promise<
  | { error: string }
  | { analisis: AnalisisCausas; causasMax: number; causasPropias: number }
> {
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elegí un archivo CSV." };
  if (archivo.size > MAX_BYTES) return { error: "El archivo supera 1 MB." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const [perfil, propias] = await Promise.all([
    supabase.from("profiles").select("causas_max").single<{ causas_max: number }>(),
    supabase.from("causas").select("nro_expediente").eq("user_id", user.id),
  ]);
  if (propias.error) return { error: "No se pudieron leer tus causas actuales." };

  const existentes = new Set(
    (propias.data ?? []).map((c) => c.nro_expediente).filter((n): n is string => !!n),
  );
  const analisis = analizarCsvCausas(await archivo.text(), existentes);
  return {
    analisis,
    causasMax: perfil.data?.causas_max ?? 60,
    causasPropias: propias.data?.length ?? 0,
  };
}

// Vista previa: no guarda nada.
export async function previsualizarCausas(formData: FormData): Promise<VistaPreviaCausas> {
  const r = await analizarArchivo(formData);
  if ("error" in r) return { error: r.error, columnasDesconocidas: [], filas: [] };
  if (r.analisis.errorGlobal) return { ...r.analisis, error: r.analisis.errorGlobal, causasMax: r.causasMax, causasPropias: r.causasPropias };
  return { ...r.analisis, causasMax: r.causasMax, causasPropias: r.causasPropias };
}

// Carga: vuelve a analizar el archivo en el servidor y solo inserta las filas válidas que el usuario eligió.
// Un único insert con varias filas: si falla, no se carga ninguna.
export async function confirmarCausas(formData: FormData): Promise<{ error?: string; message?: string }> {
  const r = await analizarArchivo(formData);
  if ("error" in r) return { error: r.error };
  if (r.analisis.errorGlobal) return { error: r.analisis.errorGlobal };

  const elegidas = new Set(formData.getAll("fila").map((v) => Number(v)));
  const incluirDuplicadas = formData.get("incluirDuplicadas") === "on";
  const permitirErrores = formData.get("permitirErrores") === "on";
  const erroneo = formData.get("modoErrores") === "erroneo";

  // Una fila se carga si es válida, o si tiene errores y el usuario eligió cargarla con los campos marcados.
  const aCargar = r.analisis.filas.filter(
    (f) =>
      elegidas.has(f.numero) &&
      (incluirDuplicadas || !f.duplicada) &&
      (f.datos || (permitirErrores && f.reparable)),
  );
  if (aCargar.length === 0) return { error: "No hay causas para cargar con la selección actual." };

  // Límite del plan: se rechaza el archivo completo, sin cargar a medias.
  const libres = r.causasMax - r.causasPropias;
  if (aCargar.length > libres) {
    return {
      error: `Tu plan permite ${Math.max(libres, 0)} causas más y el archivo tiene ${aCargar.length} para cargar. No se cargó ninguna. Reducí la selección o ampliá tu plan.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("causas")
    .insert(
      aCargar.map((f) => aFilaCausa((f.datos ?? (erroneo ? f.datosErroneo : f.datosVacios))!)),
    );
  if (error) return { error: `No se pudo importar: ${error.message}. No se cargó ninguna causa.` };

  revalidatePath("/", "layout");
  const conErrores = aCargar.filter((f) => !f.datos).length;
  const extra = conErrores ? ` ${conErrores} con campos marcados.` : "";
  return { message: `Se cargaron ${aCargar.length} causas.${extra}` };
}
