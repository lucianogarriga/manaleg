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
    .returns<Destinatario[]>();
  if (perfError) throw new Error(`No se pudieron leer los perfiles: ${perfError.message}`);

  for (const perfil of perfiles) {
    const pendientes = (porUsuario.get(perfil.id) ?? []).sort((a, b) =>
      a.proximo_vencimiento.localeCompare(b.proximo_vencimiento),
    );
    if (pendientes.length === 0) continue;
    if (dryRun) {
      resumen.emailsEnviados += 1;
      continue;
    }

    const { error: sendError } = await sendEmail({
      to: perfil.email,
      subject: armarAsunto(pendientes, hoy),
      html: armarHtml(perfil, pendientes, hoy),
    });

    if (sendError) {
      resumen.errores.push(sendError);
      continue; // no se registra: se reintenta en la próxima ejecución
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
  }

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
    const verbo = c.tipo_vencimiento === "Alerta" ? "Alerta" : "Vence";
    return `MANALEG · ${verbo} ${cuando(c.proximo_vencimiento, hoy)}: ${c.caratula}`;
  }
  return `MANALEG · ${causas.length} avisos próximos`;
}

function armarHtml(perfil: Destinatario, causas: CausaConAviso[], hoy: string): string {
  const appUrl = process.env.APP_URL;
  const saludo = perfil.nombre_completo ? `Hola ${escapeHtml(perfil.nombre_completo)},` : "Hola,";

  const filas = causas
    .map((c) => {
      const esAlerta = c.tipo_vencimiento === "Alerta";
      const color = esAlerta ? "#B45309" : "#B91C1C";
      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #DDE3ED">
            <div style="font-size:15px;font-weight:600;color:#0F172A">${escapeHtml(c.caratula)}</div>
            ${c.nro_expediente ? `<div style="font-size:12px;color:#94A3B8;font-family:monospace">${escapeHtml(c.nro_expediente)}</div>` : ""}
            <div style="margin-top:4px;font-size:14px;color:${color};font-weight:600">${esAlerta ? "Alerta" : "Vencimiento"} ${escapeHtml(cuando(c.proximo_vencimiento, hoy))}${c.motivo_vencimiento ? ` — ${escapeHtml(c.motivo_vencimiento)}` : ""}</div>
          </td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#EBF0F7;padding:24px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:520px;margin:0 auto">
    <div style="background:#0D1B30;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;font-weight:700;letter-spacing:.2px">MANALEG</div>
    <div style="background:#fff;border:1px solid #DDE3ED;border-top:0;border-radius:0 0 8px 8px;padding:18px">
      <p style="margin:0 0 4px;font-size:15px;color:#0F172A">${saludo}</p>
      <p style="margin:0 0 14px;font-size:14px;color:#475569">Tenés ${causas.length === 1 ? "un aviso próximo" : `${causas.length} avisos próximos`}:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #DDE3ED;border-radius:7px;border-collapse:separate">${filas}</table>
      ${appUrl ? `<p style="margin:16px 0 0"><a href="${escapeHtml(appUrl)}/causas" style="display:inline-block;background:#1D4ED8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:9px 16px;border-radius:6px">Abrir MANALEG</a></p>` : ""}
    </div>
    <p style="text-align:center;font-size:12px;color:#94A3B8;margin:14px 0 0">Aviso automático de MANALEG.</p>
  </div>
</body></html>`;
}
