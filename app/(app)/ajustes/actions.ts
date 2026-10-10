"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";
import { escapeHtml, sendEmail } from "@/services/email/resend";

export async function toggleNotificacionesEmail(enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ notificaciones_email: enabled })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

export async function enviarFeedback(mensaje: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const texto = mensaje.trim();
  if (!texto) return { error: "Escribí tu mensaje antes de enviar." };
  if (texto.length > 1000) return { error: "El mensaje es demasiado largo (máx. 1000 caracteres)." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email")
    .eq("id", user.id)
    .single();

  const nombre = profile?.nombre_completo ?? profile?.email ?? user.email ?? "Usuario";
  const emailUsuario = profile?.email ?? user.email ?? "—";

  return sendEmail({
    to: process.env.FEEDBACK_EMAIL ?? "contacto@manaleg.com.ar",
    subject: `Feedback Manaleg · ${escapeHtml(nombre)}`,
    html: `<!doctype html><html lang="es"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;padding:32px 16px;background:#F1F5F9">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #DDE3ED;border-radius:12px;padding:28px">
    <div style="margin-bottom:20px">
      <span style="display:inline-block;background:#2563EB;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:.4px">FEEDBACK BETA</span>
    </div>
    <p style="margin:0 0 6px;font-size:14px;color:#64748B"><strong style="color:#0F172A">${escapeHtml(nombre)}</strong> · ${escapeHtml(emailUsuario)}</p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0">
    <p style="margin:0;font-size:15px;color:#0F172A;line-height:1.65;white-space:pre-wrap">${escapeHtml(texto)}</p>
  </div>
</body></html>`,
  });
}
