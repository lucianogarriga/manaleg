"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/services/supabase/server";

export interface InvitacionPendiente {
  id: string;
  causa_id: string;
  caratula: string;
  nro_expediente: string | null;
  invitado_por: string;
}

async function usuarioActual() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ? { id: user.id, email: user.email.toLowerCase() } : null;
}

export async function listarInvitacionesPendientes(): Promise<InvitacionPendiente[]> {
  const user = await usuarioActual();
  if (!user) return [];

  const admin = createAdminClient();
  const { data: invs } = await admin
    .from("invitaciones")
    .select("id, causa_id, invitado_por_id")
    .eq("email", user.email)
    .is("aceptada_at", null)
    .is("rechazada_at", null)
    .gt("expira_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (!invs?.length) return [];

  const causaIds = [...new Set(invs.map((i) => i.causa_id))];
  const invitadorIds = [...new Set(invs.map((i) => i.invitado_por_id))];
  const [{ data: causas }, { data: invitadores }] = await Promise.all([
    admin.from("causas").select("id, caratula, nro_expediente").in("id", causaIds),
    admin.from("profiles").select("id, nombre_completo, email").in("id", invitadorIds),
  ]);
  const causaPor = new Map((causas ?? []).map((c) => [c.id, c]));
  const invitadorPor = new Map((invitadores ?? []).map((p) => [p.id, p.nombre_completo ?? p.email ?? "Un colega"]));

  return invs.flatMap((i) => {
    const c = causaPor.get(i.causa_id);
    if (!c) return [];
    return [{
      id: i.id,
      causa_id: i.causa_id,
      caratula: c.caratula,
      nro_expediente: c.nro_expediente,
      invitado_por: invitadorPor.get(i.invitado_por_id) ?? "Un colega",
    }];
  });
}

export async function aceptarInvitaciones(ids: string[]): Promise<{ error?: string; aceptadas?: number }> {
  const user = await usuarioActual();
  if (!user) return { error: "No autenticado." };
  if (ids.length === 0) return { aceptadas: 0 };

  const admin = createAdminClient();
  const { data: invs } = await admin
    .from("invitaciones")
    .select("id, causa_id, invitado_por_id")
    .in("id", ids)
    .eq("email", user.email)
    .is("aceptada_at", null)
    .is("rechazada_at", null)
    .gt("expira_at", new Date().toISOString());
  if (!invs?.length) return { aceptadas: 0 };

  const { error } = await admin.from("causa_shares").upsert(
    invs.map((i) => ({
      causa_id: i.causa_id,
      shared_with_user_id: user.id,
      invited_by_user_id: i.invitado_por_id,
    })),
    { onConflict: "causa_id,shared_with_user_id", ignoreDuplicates: true },
  );
  if (error) return { error: "No se pudo aceptar la invitación. Probá de nuevo." };

  await admin
    .from("invitaciones")
    .update({ aceptada_at: new Date().toISOString() })
    .in("id", invs.map((i) => i.id));

  revalidatePath("/", "layout");
  return { aceptadas: invs.length };
}

export async function rechazarInvitaciones(ids: string[]): Promise<{ error?: string }> {
  const user = await usuarioActual();
  if (!user) return { error: "No autenticado." };
  if (ids.length === 0) return {};

  const admin = createAdminClient();
  const { error } = await admin
    .from("invitaciones")
    .update({ rechazada_at: new Date().toISOString() })
    .in("id", ids)
    .eq("email", user.email)
    .is("aceptada_at", null);
  if (error) return { error: "No se pudo rechazar la invitación." };
  return {};
}
