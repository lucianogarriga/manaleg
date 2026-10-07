"use server";

import { createClient } from "@/services/supabase/server";

export async function markWelcomeSeen() {
  const supabase = await createClient();
  await supabase.auth.updateUser({ data: { has_seen_welcome: true } });
}
