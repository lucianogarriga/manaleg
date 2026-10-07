import { createAdminClient } from "@/services/supabase/admin";
import { escapeHtml, sendEmail } from "@/services/email/resend";
import { esHabil, siguienteHabil } from "@/utils/diasHabiles";
import { addDaysISO, formatDate, formatLongDate, todayISO } from "@/utils/formatters";
import type { TipoAviso } from "@/types";

interface CausaConAviso {
  id: string;
  caratula: string;
  nro_expediente: string | null;
  proximo_vencimiento: string;
  tipo_vencimiento: TipoAviso | null;
  motivo_vencimiento: string | null;
  user_id: string;
  causa_shares: { shared_with_user_id: string }[];
}

interface Destinatario {
  id: string;
  email: string;
  nombre_completo: string | null;
}

export interface ResumenAvisos {
  hoy: string;
  omitido?: string; // motivo por el que no se envió nada (ej. hoy no es día hábil)
  causasCandidatas: number;
  emailsEnviados: number;
  yaEnviados: number; // omitidos porque ya se habían avisado
  errores: string[];
  dryRun: boolean;
}

const HORIZONTE_DIAS = 21; // tope de búsqueda (por si el próximo hábil está lejos: feria judicial)

// Manda por email, a cada usuario con acceso a la causa (titular y colaboradores),
// las alertas y vencimientos que caen hasta el PRÓXIMO DÍA HÁBIL, contando sus
// feriados y días inhábiles (nacionales + los que cargó él).
//   Lunes a jueves → lo de mañana.  Viernes → lo del lunes (o el siguiente hábil).
//   Si hoy no es hábil para el usuario (fin de semana, feriado, feria) no se le manda nada.
// Se ejecuta de lunes a viernes (cron). Con dryRun=true calcula pero no envía ni registra.
export async function enviarAvisos({ dryRun = false } = {}): Promise<ResumenAvisos> {
  const hoy = todayISO();
  const resumen: ResumenAvisos = {
    hoy,
    causasCandidatas: 0,
    emailsEnviados: 0,
    yaEnviados: 0,
    errores: [],
    dryRun,
  };

  const admin = createAdminClient();

  // Días inhábiles: feriados globales (user_id null) + los personales de cada usuario
  const { data: inhabilesRows, error: inhError } = await admin
    .from("dias_inhabiles")
    .select("user_id, fecha")
    .gte("fecha", hoy);
  if (inhError) throw new Error(`No se pudieron leer los días inhábiles: ${inhError.message}`);

  const globales = new Set<string>();
  const personales = new Map<string, Set<string>>();
  for (const r of inhabilesRows ?? []) {
    if (r.user_id === null) globales.add(r.fecha);
    else personales.set(r.user_id, (personales.get(r.user_id) ?? new Set()).add(r.fecha));
  }
  const inhabilesDe = (userId: string): Set<string> => new Set([...globales, ...(personales.get(userId) ?? [])]);

  // Si hoy no es hábil ni para el calendario general, no hay nada que hacer
  if (!esHabil(hoy, globales)) {
    resumen.omitido = "Hoy no es día hábil (fin de semana o feriado): no se envían avisos";
    return resumen;
  }

  const { data: causas, error } = await admin
    .from("causas")
    .select(
      "id, caratula, nro_expediente, proximo_vencimiento, tipo_vencimiento, motivo_vencimiento, user_id, causa_shares(shared_with_user_id)",
    )
    .gt("proximo_vencimiento", hoy)
    .lte("proximo_vencimiento", addDaysISO(hoy, HORIZONTE_DIAS))
    .neq("estado", "Cerrada")
    .returns<CausaConAviso[]>();

  if (error) throw new Error(`No se pudieron leer las causas: ${error.message}`);
  resumen.causasCandidatas = causas.length;
  if (causas.length === 0) return resumen;

  // Avisos que ya se mandaron (para no repetirlos)
  const { data: previos, error: prevError } = await admin
    .from("avisos_enviados")
    .select("causa_id, user_id, fecha_vencimiento")
    .in("causa_id", causas.map((c) => c.id))
    .eq("canal", "email");
  if (prevError) throw new Error(`No se pudo leer avisos_enviados: ${prevError.message}`);
  const yaAvisado = new Set((previos ?? []).map((p) => `${p.causa_id}:${p.user_id}:${p.fecha_vencimiento}`));

  // usuario → causas a avisar hoy, según el próximo día hábil de ESE usuario
  const porUsuario = new Map<string, CausaConAviso[]>();
  const usuarios = new Set(causas.flatMap((c) => [c.user_id, ...c.causa_shares.map((s) => s.shared_with_user_id)]));

  for (const userId of usuarios) {
    const inh = inhabilesDe(userId);
    if (!esHabil(hoy, inh)) continue; // hoy es inhábil para este usuario (ej. feria judicial)
    const limite = siguienteHabil(hoy, inh);

    for (const c of causas) {
      const tieneAcceso = c.user_id === userId || c.causa_shares.some((s) => s.shared_with_user_id === userId);
      if (!tieneAcceso || c.proximo_vencimiento > limite) continue;

      if (yaAvisado.has(`${c.id}:${userId}:${c.proximo_vencimiento}`)) {
        resumen.yaEnviados++;
        continue;
      }
      porUsuario.set(userId, [...(porUsuario.get(userId) ?? []), c]);
    }
  }
  if (porUsuario.size === 0) return resumen;

  const { data: perfiles, error: perfError } = await admin
    .from("profiles")
    .select("id, email, nombre_completo")
    .in("id", [...porUsuario.keys()])
    .eq("notificaciones_email", true)   // respeta la preferencia del usuario
    .returns<Destinatario[]>();
  if (perfError) throw new Error(`No se pudieron leer los perfiles: ${perfError.message}`);

  await Promise.allSettled(
    perfiles.map(async (perfil) => {
      const pendientes = (porUsuario.get(perfil.id) ?? []).sort((a, b) =>
        a.proximo_vencimiento.localeCompare(b.proximo_vencimiento),
      );
      if (pendientes.length === 0) return;
      if (dryRun) {
        resumen.emailsEnviados += 1;
        return;
      }

      const { error: sendError } = await sendEmail({
        to: perfil.email,
        subject: armarAsunto(pendientes, hoy),
        html: armarHtml(perfil, pendientes, hoy),
      });

      if (sendError) {
        resumen.errores.push(sendError);
        return; // no se registra: se reintenta en la próxima ejecución
      }

      const { error: logError } = await admin.from("avisos_enviados").insert(
        pendientes.map((c) => ({
          causa_id: c.id,
          user_id: perfil.id,
          fecha_vencimiento: c.proximo_vencimiento,
          canal: "email",
        })),
      );
      if (logError) resumen.errores.push(`No se pudo registrar el aviso enviado: ${logError.message}`);
      resumen.emailsEnviados += 1;
    }),
  );

  return resumen;
}

// "mañana" si es el día siguiente; si no, el día (ej. "el lun 05/10")
function cuando(fecha: string, hoy: string): string {
  return fecha === addDaysISO(hoy, 1)
    ? "mañana"
    : `el ${formatLongDate(fecha).split(" ").slice(0, 2).join(" ").toLowerCase()} (${formatDate(fecha).slice(0, 5)})`;
}

function armarAsunto(causas: CausaConAviso[], hoy: string): string {
  if (causas.length === 1) {
    const c = causas[0];
    const verbo = c.tipo_vencimiento === "Recordatorio" ? "Recordatorio" : "Vence";
    return `MANALEG · ${verbo} ${cuando(c.proximo_vencimiento, hoy)}: ${c.caratula}`;
  }
  return `MANALEG · ${causas.length} avisos próximos`;
}

function armarHtml(perfil: Destinatario, causas: CausaConAviso[], hoy: string): string {
  const appUrl = process.env.APP_URL;
  const nombre = perfil.nombre_completo ? escapeHtml(perfil.nombre_completo) : null;
  const saludo = nombre ? `Hola, ${nombre}` : "Hola";
  const resumen = causas.length === 1 ? "un vencimiento" : `${causas.length} vencimientos`;

  const cards = causas
    .map((c) => {
      const esAudiencia = c.tipo_vencimiento === "Audiencia";
      const borderColor  = esAudiencia ? "#7C3AED" : "#DC2626";
      const bgColor      = esAudiencia ? "#F5F3FF"  : "#FFFAFA";
      const wrapBorder   = esAudiencia ? "#DDD6FE"  : "#FEE2E2";
      const labelBg      = esAudiencia ? "#EDE9FE"  : "#FEE2E2";
      const labelColor   = esAudiencia ? "#6D28D9"  : "#B91C1C";
      const chipText     = esAudiencia ? "AUDIENCIA" : "VENCIMIENTO";
      const tipoTexto    = esAudiencia ? "Audiencia" : "Vence";
      const fechaTexto   = escapeHtml(cuando(c.proximo_vencimiento, hoy));
      const motivo       = c.motivo_vencimiento ? ` · ${escapeHtml(c.motivo_vencimiento)}` : "";
      const expte        = c.nro_expediente
        ? `<div style="font-family:monospace;font-size:11px;color:#94A3B8;margin-bottom:6px">${escapeHtml(c.nro_expediente)}</div>`
        : "";
      return `
        <div style="border:1px solid ${wrapBorder};border-left:4px solid ${borderColor};border-radius:8px;padding:14px 16px;margin-bottom:10px;background:${bgColor}">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:top">
              <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:3px;line-height:1.3">${escapeHtml(c.caratula)}</div>
              ${expte}
              <div style="font-size:13px;color:${labelColor};font-weight:600">${tipoTexto} ${fechaTexto}${motivo}</div>
            </td>
            <td style="vertical-align:top;padding-left:10px;white-space:nowrap">
              <span style="display:inline-block;background:${labelBg};color:${labelColor};font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px">${chipText}</span>
            </td>
          </tr></table>
        </div>`;
    })
    .join("");

  const ctaBtn = appUrl
    ? `<p style="margin:22px 0 0"><a href="${escapeHtml(appUrl)}/causas" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px;letter-spacing:.1px">Abrir MANALEG →</a></p>`
    : "";

  const settingsUrl = appUrl ? `${escapeHtml(appUrl)}` : "#";

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;background:#F1F5F9;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto">

    <!-- Header -->
    <div style="background:#0F1F3D;border-radius:12px 12px 0 0;padding:20px 28px">
      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
        <td style="vertical-align:middle;padding-right:12px">
          <div style="width:32px;height:32px;background:#2563EB;border-radius:8px;text-align:center;line-height:32px;font-weight:800;font-size:15px;color:#fff;letter-spacing:-.3px">M</div>
        </td>
        <td style="vertical-align:middle">
          <span style="font-size:15px;font-weight:700;color:#fff;letter-spacing:.4px">MANALEG</span>
        </td>
      </tr></table>
    </div>

    <!-- Body -->
    <div style="background:#fff;border:1px solid #DDE3ED;border-top:0;border-radius:0 0 12px 12px;padding:28px">
      <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#0F172A">${saludo}</p>
      <p style="margin:0 0 22px;font-size:14px;color:#64748B;line-height:1.55">Tenés <strong style="color:#0F172A">${resumen}</strong> para el próximo día hábil.</p>
      ${cards}
      ${ctaBtn}
    </div>

    <!-- Footer -->
    <div style="padding:16px 0 0;text-align:center">
      <p style="margin:0 0 4px;font-size:12px;color:#94A3B8">Este email fue generado automáticamente por MANALEG.</p>
      <p style="margin:0;font-size:12px;color:#94A3B8">
        Podés desactivar estas alertas desde <a href="${settingsUrl}" style="color:#2563EB;text-decoration:none">tu configuración</a>
        &nbsp;·&nbsp;
        <a href="mailto:contacto@manaleg.com.ar" style="color:#94A3B8;text-decoration:none">contacto@manaleg.com.ar</a>
      </p>
    </div>

  </div>
</body></html>`;
}
