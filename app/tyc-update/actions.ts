"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { CURRENT_TYC_VERSION } from "@/utils/constants";

export async function acceptUpdatedTyc(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");

  const { error } = await supabase.rpc("aceptar_tyc", { p_version: CURRENT_TYC_VERSION });

  if (error) redirect("/tyc-update?error=1");

  redirect("/");
}
