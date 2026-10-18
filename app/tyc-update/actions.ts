"use server";

import { createClient } from "@/services/supabase/server";
import { CURRENT_TYC_VERSION } from "@/utils/constants";

// Registra la aceptación de la versión vigente. Devuelve un error legible en vez de redirigir,
// porque se llama desde el modal que se muestra sobre la app.
export async function acceptUpdatedTyc(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) return { error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const { error } = await supabase.rpc("aceptar_tyc", { p_version: CURRENT_TYC_VERSION });
  if (error) return { error: "No se pudo registrar la aceptación. Intentá de nuevo." };

  return {};
}
