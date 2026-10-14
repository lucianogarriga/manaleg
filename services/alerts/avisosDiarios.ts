import { createAdminClient } from "@/services/supabase/admin";
import { escapeHtml, sendEmail } from "@/services/email/resend";
import { esHabil, siguienteHabil } from "@/utils/diasHabiles";
import { addDaysISO, formatDate, formatLongDate, todayISO } from "@/utils/formatters";

type Origen = "vencimiento" | "evento";

interface CausaDeAviso {
  caratula: string;
  nro_expediente: string | null;
  estado: string;
  user_id: string;
  causa_shares: { shared_with_user_id: string }[];
}

interface FilaVencimiento {
  id: string;
  causa_id: string;
  tipo: string;
  fecha: string;
  motivo: string | null;
  anticipacion: string;
  causa: CausaDeAviso;
}

interface FilaEvento {
  id: string;
  causa_id: string;
  tipo: string;
  titulo: string;
  fecha: string;
  hora: string | null;
  causa: CausaDeAviso;
}

interface Aviso {
  origen: Origen;
  origenId: string;
  causaId: string;
  caratula: string;
  nro_expediente: string | null;
  fecha: string;
  hora: string | null;
  tipo: string;
  motivo: string | null;
  anticipacion: string;
  propietarioId: string;
  colaboradores: string[];
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

const CAUSA_EMBED = "causa:causas!inner(caratula, nro_expediente, estado, user_id, causa_shares(shared_with_user_id))";

// Manda por email, a cada usuario con acceso a la causa (titular y colaboradores), los
// vencimientos y eventos que le corresponde avisar hoy. Cada aviso se envía una sola vez:
// se reserva en avisos_enviados antes de mandar el email, y se libera si el envío falla.
//   Anticipación "1 día": se avisa desde el próximo día hábil del usuario (lunes a jueves → lo de mañana;
//   viernes → lo del lunes). "3 días" y "1 semana" avisan desde esa cantidad de días antes.
//   Si hoy no es hábil para el usuario (fin de semana, feriado, feria) no se le manda nada.
// Con dryRun=true calcula pero no envía ni registra.
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

  if (!esHabil(hoy, globales)) {
    resumen.omitido = "Hoy no es día hábil (fin de semana o feriado): no se envían avisos";
    return resumen;
  }

  const horizonte = addDaysISO(hoy, HORIZONTE_DIAS);

  const { data: vencimientos, error: vError } = await admin
    .from("vencimientos")
    .select(`id, causa_id, tipo, fecha, motivo, anticipacion, ${CAUSA_EMBED}`)
    .eq("completado", false)
    .in("tipo", ["Vencimiento", "Audiencia"])
    .gt("fecha", hoy)
    .lte("fecha", horizonte)
    .neq("causa.estado", "Cerrada")
    .returns<FilaVencimiento[]>();
  if (vError) throw new Error(`No se pudieron leer los vencimientos: ${vError.message}`);

  const { data: eventos, error: eError } = await admin
    .from("eventos")
    .select(`id, causa_id, tipo, titulo, fecha, hora, ${CAUSA_EMBED}`)
    .gt("fecha", hoy)
    .lte("fecha", horizonte)
    .neq("causa.estado", "Cerrada")
    .returns<FilaEvento[]>();
  if (eError) throw new Error(`No se pudieron leer los eventos: ${eError.message}`);

  const avisos: Aviso[] = [
    ...(vencimientos ?? []).map((v): Aviso => ({
      origen: "vencimiento",
      origenId: v.id,
      causaId: v.causa_id,
      caratula: v.causa.caratula,
      nro_expediente: v.causa.nro_expediente,
      fecha: v.fecha,
      hora: null,
      tipo: v.tipo,
      motivo: v.motivo,
      anticipacion: v.anticipacion,
      propietarioId: v.causa.user_id,
      colaboradores: v.causa.causa_shares.map((s) => s.shared_with_user_id),
    })),
    ...(eventos ?? []).map((e): Aviso => ({
      origen: "evento",
      origenId: e.id,
      causaId: e.causa_id,
      caratula: e.causa.caratula,
      nro_expediente: e.causa.nro_expediente,
      fecha: e.fecha,
      hora: e.hora,
      tipo: e.tipo,
      motivo: e.titulo,
      anticipacion: "1 día",
      propietarioId: e.causa.user_id,
      colaboradores: e.causa.causa_shares.map((s) => s.shared_with_user_id),
    })),
  ];

  resumen.causasCandidatas = avisos.length;
  if (avisos.length === 0) return resumen;

  const { data: previos, error: prevError } = await admin
    .from("avisos_enviados")
    .select("user_id, origen_tipo, origen_id")
    .eq("canal", "email")
    .in("origen_id", avisos.map((a) => a.origenId));
  if (prevError) throw new Error(`No se pudo leer avisos_enviados: ${prevError.message}`);
  const yaAvisado = new Set((previos ?? []).map((p) => `${p.origen_tipo}:${p.origen_id}:${p.user_id}`));

  const porUsuario = new Map<string, Aviso[]>();
  const usuarios = new Set(avisos.flatMap((a) => [a.propietarioId, ...a.colaboradores]));

  for (const userId of usuarios) {
    const inh = inhabilesDe(userId);
    if (!esHabil(hoy, inh)) continue;
    const proximoHabil = siguienteHabil(hoy, inh);

    for (const a of avisos) {
      const tieneAcceso = a.propietarioId === userId || a.colaboradores.includes(userId);
      if (!tieneAcceso || a.fecha > limiteAviso(a.anticipacion, hoy, proximoHabil)) continue;

      if (yaAvisado.has(`${a.origen}:${a.origenId}:${userId}`)) {
        resumen.yaEnviados++;
        continue;
      }
      porUsuario.set(userId, [...(porUsuario.get(userId) ?? []), a]);
    }
  }
  if (porUsuario.size === 0) return resumen;

  const { data: perfiles, error: perfError } = await admin
    .from("profiles")
    .select("id, email, nombre_completo")
    .in("id", [...porUsuario.keys()])
    .eq("notificaciones_email", true)
    .returns<Destinatario[]>();
  if (perfError) throw new Error(`No se pudieron leer los perfiles: ${perfError.message}`);

  await Promise.allSettled(
    perfiles.map(async (perfil) => {
      const pendientes = (porUsuario.get(perfil.id) ?? []).sort((a, b) => a.fecha.localeCompare(b.fecha));
      if (pendientes.length === 0) return;
      if (dryRun) {
        resumen.emailsEnviados += 1;
        return;
      }

      const { error: reservaError } = await admin.from("avisos_enviados").insert(
        pendientes.map((a) => ({
          causa_id: a.causaId,
          user_id: perfil.id,
          fecha_vencimiento: a.fecha,
          canal: "email",
          origen_tipo: a.origen,
          origen_id: a.origenId,
        })),
      );
      if (reservaError) {
        resumen.errores.push(`No se pudo reservar el aviso: ${reservaError.message}`);
        return;
      }

      const { error: sendError } = await sendEmail({
        to: perfil.email,
        subject: armarAsunto(pendientes, hoy),
        html: armarHtml(perfil, pendientes, hoy),
      });

      if (sendError) {
        resumen.errores.push(sendError);
        const { error: liberarError } = await admin
          .from("avisos_enviados")
          .delete()
          .eq("user_id", perfil.id)
          .eq("canal", "email")
          .in("origen_id", pendientes.map((a) => a.origenId));
        if (liberarError) resumen.errores.push(`No se pudo liberar la reserva: ${liberarError.message}`);
        return;
      }

      resumen.emailsEnviados += 1;
    }),
  );

  return resumen;
}

// Hasta cuándo se avisa un aviso, según su anticipación (fechas hasta esa inclusive)
function limiteAviso(anticipacion: string, hoy: string, proximoHabil: string): string {
  if (anticipacion === "3 días") return addDaysISO(hoy, 3);
  if (anticipacion === "1 semana") return addDaysISO(hoy, 7);
  return proximoHabil;
}

// "mañana" si es el día siguiente; si no, el día (ej. "el lun 05/10")
function cuando(fecha: string, hoy: string, hora: string | null): string {
  const dia =
    fecha === addDaysISO(hoy, 1)
      ? "mañana"
      : `el ${formatLongDate(fecha).split(" ").slice(0, 2).join(" ").toLowerCase()} (${formatDate(fecha).slice(0, 5)})`;
  return hora ? `${dia} a las ${hora.slice(0, 5)}` : dia;
}

function armarAsunto(avisos: Aviso[], hoy: string): string {
  if (avisos.length === 1) {
    const a = avisos[0];
    const verbo = a.origen === "evento" ? a.tipo : a.tipo === "Audiencia" ? "Audiencia" : "Vence";
    return `Manaleg · ${verbo} ${cuando(a.fecha, hoy, a.hora)}: ${a.caratula}`;
  }
  return `Manaleg · ${avisos.length} avisos próximos`;
}

function armarHtml(perfil: Destinatario, avisos: Aviso[], hoy: string): string {
  const appUrl = process.env.APP_URL;
  const nombre = perfil.nombre_completo ? escapeHtml(perfil.nombre_completo) : null;
  const saludo = nombre ? `Hola, ${nombre}` : "Hola";
  const resumen = avisos.length === 1 ? "un aviso" : `${avisos.length} avisos`;

  const cards = avisos
    .map((a) => {
      const esAudiencia = a.origen === "evento" || a.tipo === "Audiencia";
      const borderColor  = esAudiencia ? "#7C3AED" : "#DC2626";
      const bgColor      = esAudiencia ? "#F5F3FF"  : "#FFFAFA";
      const wrapBorder   = esAudiencia ? "#DDD6FE"  : "#FEE2E2";
      const labelBg      = esAudiencia ? "#EDE9FE"  : "#FEE2E2";
      const labelColor   = esAudiencia ? "#6D28D9"  : "#B91C1C";
      const chipText     = a.origen === "evento" ? a.tipo.toUpperCase() : esAudiencia ? "AUDIENCIA" : "VENCIMIENTO";
      const tipoTexto    = a.origen === "evento" ? a.tipo : esAudiencia ? "Audiencia" : "Vence";
      const fechaTexto   = escapeHtml(cuando(a.fecha, hoy, a.hora));
      const motivo       = a.motivo ? ` · ${escapeHtml(a.motivo)}` : "";
      const expte        = a.nro_expediente
        ? `<div style="font-family:monospace;font-size:11px;color:#94A3B8;margin-bottom:6px">${escapeHtml(a.nro_expediente)}</div>`
        : "";
      return `
        <div style="border:1px solid ${wrapBorder};border-left:4px solid ${borderColor};border-radius:8px;padding:14px 16px;margin-bottom:10px;background:${bgColor}">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:top">
              <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:3px;line-height:1.3">${escapeHtml(a.caratula)}</div>
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
    ? `<p style="margin:22px 0 0"><a href="${escapeHtml(appUrl)}/causas" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px;letter-spacing:.1px">Abrir Manaleg →</a></p>`
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
          <span style="font-size:15px;font-weight:700;color:#fff;letter-spacing:.4px">Manaleg</span>
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
      <p style="margin:0 0 4px;font-size:12px;color:#94A3B8">Este email fue generado automáticamente por Manaleg.</p>
      <p style="margin:0;font-size:12px;color:#94A3B8">
        Podés desactivar estas alertas desde <a href="${settingsUrl}" style="color:#2563EB;text-decoration:none">tu configuración</a>
        &nbsp;·&nbsp;
        <a href="mailto:contacto@manaleg.com.ar" style="color:#94A3B8;text-decoration:none">contacto@manaleg.com.ar</a>
      </p>
    </div>

  </div>
</body></html>`;
}
