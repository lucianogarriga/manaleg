"use server";

import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/services/supabase/server";

export async function aceptarInvitacion(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const volver = `/invitacion/${token}`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitaciones")
    .select("id, causa_id, invitado_por_id, email, expira_at, aceptada_at")
    .eq("token_hash", tokenHash)
    .maybeSingle<{ id: string; causa_id: string; invitado_por_id: string; email: string; expira_at: string; aceptada_at: string | null }>();

  if (!inv || inv.aceptada_at || new Date(inv.expira_at) <= new Date()) redirect(volver);
  if (user.email?.toLowerCase() !== inv.email) redirect(`${volver}?error=cuenta`);

  const { error } = await admin.from("causa_shares").insert({
    causa_id: inv.causa_id,
    shared_with_user_id: user.id,
    invited_by_user_id: inv.invitado_por_id,
  });
  if (error && error.code !== "23505") redirect(`${volver}?error=1`);

  await admin.from("invitaciones").update({ aceptada_at: new Date().toISOString() }).eq("id", inv.id);

  revalidatePath("/", "layout");
  redirect("/causas");
}
