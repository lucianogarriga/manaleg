// Envío de emails con Resend (https://resend.com), sin dependencias:
// es una sola llamada HTTP.

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { error: "Faltan RESEND_API_KEY o EMAIL_FROM en las variables de entorno" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    // EMAIL_REPLY_TO (opcional): a dónde llegan las respuestas del usuario
    body: JSON.stringify({ from, to, subject, html, reply_to: process.env.EMAIL_REPLY_TO || undefined }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `Resend respondió ${res.status}: ${body.slice(0, 200)}` };
  }
  return {};
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
