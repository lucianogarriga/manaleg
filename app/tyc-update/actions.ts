"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { CURRENT_TYC_VERSION } from "@/utils/constants";

export async function acceptUpdatedTyc(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ tyc_accepted_at: new Date().toISOString(), tyc_version: CURRENT_TYC_VERSION })
    .eq("id", userId);

  if (error) return { error: "No se pudo registrar la aceptación. Intentá de nuevo." };

  redirect("/");
}
