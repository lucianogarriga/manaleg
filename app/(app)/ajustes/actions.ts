"use server";

import { createClient } from "@/services/supabase/server";
import { escapeHtml, sendEmail } from "@/services/email/resend";
import { dentroDelLimite } from "@/services/security/limites";
import { esPaletaValida } from "@/utils/paletas";
import { todayISO } from "@/utils/formatters";
import type { MonedaJudicial } from "@/types";

export async function toggleNotificacionesEmail(enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ notificaciones_email: enabled })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function guardarPaleta(paleta: string): Promise<{ error?: string }> {
  if (!esPaletaValida(paleta)) return { error: "Paleta no válida." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ paleta })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function enviarFeedback(mensaje: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const texto = mensaje.trim();
  if (!texto) return { error: "Escribí tu mensaje antes de enviar." };
  if (texto.length > 1000) return { error: "El mensaje es demasiado largo (máx. 1000 caracteres)." };

  if (!(await dentroDelLimite(`feedback:${user.id}`, 5, 3600)))
    return { error: "Enviaste varios comentarios seguidos. Probá de nuevo en un rato." };

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

export async function listarMonedasJudiciales(): Promise<MonedaJudicial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("monedas_judiciales")
    .select("id, nombre, referencia, valor, valor_fecha")
    .order("nombre", { ascending: true })
    .returns<MonedaJudicial[]>();
  return data ?? [];
}

export async function guardarMonedaJudicial(input: {
  id?: string;
  nombre: string;
  referencia: string;
  valor: number;
}): Promise<{ error?: string; moneda?: MonedaJudicial }> {
  const nombre = input.nombre.trim();
  const referencia = input.referencia.trim();
  if (!nombre || nombre.length > 30) return { error: "El nombre de la moneda tiene que tener entre 1 y 30 caracteres." };
  if (referencia.length > 60) return { error: "La referencia es demasiado larga (máx. 60 caracteres)." };
  if (!Number.isFinite(input.valor) || input.valor <= 0) return { error: "El valor tiene que ser mayor a cero." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const datos = { nombre, referencia: referencia || null, valor: input.valor, valor_fecha: todayISO() };
  const consulta = input.id
    ? supabase.from("monedas_judiciales").update(datos).eq("id", input.id)
    : supabase.from("monedas_judiciales").insert({ ...datos, user_id: user.id });
  const { data, error } = await consulta.select("id, nombre, referencia, valor, valor_fecha").single<MonedaJudicial>();
  if (error) {
    return { error: error.code === "23505" ? `Ya tenés una moneda llamada "${nombre}".` : error.message };
  }
  return { moneda: data };
}

export async function eliminarMonedaJudicial(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("monedas_judiciales").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}
