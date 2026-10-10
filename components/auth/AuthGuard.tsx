import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { CURRENT_TYC_VERSION } from "@/utils/constants";
import type { Profile } from "@/types";

// Valida la sesión en el servidor y devuelve el perfil del usuario.
// cache(): si varios Server Components lo llaman en el mismo request,
// se consulta a Supabase una sola vez.
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (!userId) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  if (error || !profile) redirect("/login");

  return profile;
});

// Envuelve las rutas protegidas. proxy.ts ya redirige a /login;
// esto es la segunda línea de defensa, validada en el servidor.
export default async function AuthGuard({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  // Si el perfil tiene una versión anterior de T&C, redirigir a re-aceptación.
  // Exceptuamos la propia ruta /tyc-update para evitar loop.
  if (profile.tyc_version !== CURRENT_TYC_VERSION) {
    redirect("/tyc-update");
  }

  return children;
}
