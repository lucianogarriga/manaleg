import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Cliente con la clave SECRETA (service role): se salta RLS y ve los datos de
// todos los usuarios. Usar SOLO en el servidor para tareas automáticas
// (cron de avisos). Nunca importarlo desde un Client Component.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno");

  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
