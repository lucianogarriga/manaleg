"use server";

import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/services/supabase/server";
import { escapeHtml, sendEmail } from "@/services/email/resend";
import { dentroDelLimite } from "@/services/security/limites";
import { text } from "@/utils/formData";
import type { FormState } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIAS_VIGENCIA = 7;

// La respuesta es igual exista o no una cuenta con ese email: no revela quién está registrado.
const MENSAJE_INVITACION = "Si el email puede recibir la invitación, le enviamos un enlace para unirse a la causa.";

// Invita por email a un colega. El acceso se crea recién cuando lo acepta con el enlace.
export async function shareCausa(_prev: FormState, formData: FormData): Promise<FormState> {
  const causaId = text(formData, "causa_id");
  const email = text(formData, "email")?.toLowerCase();

  if (!causaId) return { error: "Falta la causa." };
  if (!email || !EMAIL_RE.test(email)) return { error: "Ingresá un email válido." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  if (!(await dentroDelLimite(`invitar:${user.id}`, 30, 86400)))
    return { error: "Enviaste demasiadas invitaciones hoy. Probá mañana." };

  const { data: causa } = await supabase
    .from("causas")
    .select("id, user_id, caratula")
    .eq("id", causaId)
    .maybeSingle<{ id: string; user_id: string; caratula: string }>();
  if (!causa) return { error: "No se encontró la causa." };
  if (causa.user_id !== user.id) return { error: "Solo el titular de la causa puede compartirla." };
  if (email === user.email?.toLowerCase()) return { error: "No podés compartir una causa con vos mismo." };

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiraAt = new Date(Date.now() + DIAS_VIGENCIA * 86400000).toISOString();

  const admin = createAdminClient();
  const { data: destino } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
    .maybeSingle<{ id: string }>();
  const { error } = await admin.from("invitaciones").insert({
    causa_id: causaId,
    invitado_por_id: user.id,
    email,
    token_hash: tokenHash,
    expira_at: expiraAt,
  });
  if (error) {
    console.error("[shareCausa] no se pudo guardar la invitación:", error.message);
    return { message: MENSAJE_INVITACION };
  }

  // Si ya tiene cuenta, la invitación aparece en Manaleg para aceptarla ahí, sin email.
  if (destino) {
    revalidatePath("/", "layout");
    return { message: "Listo. Tu colega verá la invitación al ingresar a Manaleg." };
  }

  const h = await headers();
  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? h.get("origin") ?? "http://localhost:3000";
  const enlace = `${origen}/invitacion/${token}`;
  const invitador = user.user_metadata?.nombre_completo ?? user.email ?? "Un colega";

  const { error: mailError } = await sendEmail({
    to: email,
    subject: `Manaleg · ${invitador} te invitó a una causa`,
    html: `<!doctype html><html lang="es"><body style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;background:#F1F5F9;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #DDE3ED;border-radius:12px;padding:24px">
        <p style="margin:0 0 12px;font-size:16px;color:#0F172A"><strong>${escapeHtml(invitador)}</strong> te invitó a colaborar en la causa <strong>${escapeHtml(causa.caratula)}</strong> en Manaleg.</p>
        <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6">Para aceptar, ingresá o registrate con <strong>${escapeHtml(email)}</strong> y abrí este enlace. Vence en ${DIAS_VIGENCIA} días.</p>
        <p style="margin:0"><a href="${escapeHtml(enlace)}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px">Ver la invitación</a></p>
        <p style="margin:20px 0 0;font-size:12px;color:#94A3B8">Si no esperabas esta invitación, podés ignorar este email.</p>
      </div></body></html>`,
  });
  if (mailError) console.error("[shareCausa] no se pudo enviar el email:", mailError);

  revalidatePath("/", "layout");
  return { message: MENSAJE_INVITACION };
}

export async function revokeAccess(shareId: string): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("causa_shares").delete().eq("id", shareId).select("id");

  if (error) return { error: `No se pudo quitar el acceso: ${error.message}` };
  if (!data || data.length === 0) return { error: "Solo el titular de la causa puede quitar el acceso." };

  revalidatePath("/", "layout");
  return { message: "Acceso quitado." };
}
