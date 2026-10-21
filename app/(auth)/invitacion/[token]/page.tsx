import Link from "next/link";
import { createHash } from "crypto";
import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/services/supabase/server";
import { aceptarInvitacion } from "../actions";

export const metadata = { title: "Invitación — MANALEG" };

interface InvitacionRow {
  causa_id: string;
  invitado_por_id: string;
  email: string;
  expira_at: string;
  aceptada_at: string | null;
}

function Mensaje({ titulo, texto, children }: { titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text)" }}>{titulo}</h1>
      <p className="text-[13.5px] leading-[1.6]" style={{ color: "var(--color-sub)" }}>{texto}</p>
      {children}
    </div>
  );
}

export default async function InvitacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitaciones")
    .select("causa_id, invitado_por_id, email, expira_at, aceptada_at")
    .eq("token_hash", tokenHash)
    .maybeSingle<InvitacionRow>();

  const vigente = inv && !inv.aceptada_at && new Date(inv.expira_at) > new Date();
  if (!inv || !vigente) {
    return (
      <Mensaje
        titulo="Invitación no válida"
        texto="El enlace no existe, ya se usó o venció. Pedile a quien te invitó que te envíe una nueva."
      />
    );
  }

  const [{ data: causa }, { data: invitador }] = await Promise.all([
    admin.from("causas").select("caratula").eq("id", inv.causa_id).maybeSingle<{ caratula: string }>(),
    admin.from("profiles").select("nombre_completo, email").eq("id", inv.invitado_por_id).maybeSingle<{ nombre_completo: string | null; email: string }>(),
  ]);
  const quien = invitador?.nombre_completo ?? invitador?.email ?? "Un colega";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Mensaje
        titulo="Te invitaron a una causa"
        texto={`${quien} te invitó a colaborar en "${causa?.caratula ?? "una causa"}". Para aceptar, ingresá o registrate con ${inv.email} y volvé a abrir este enlace.`}
      >
        <div className="flex gap-3">
          <Link href="/login" className="rounded-[8px] bg-blue px-4 py-[9px] text-[13.5px] font-semibold text-on-primary hover:opacity-90">Ingresar</Link>
          <Link href="/register" className="rounded-[8px] border px-4 py-[9px] text-[13.5px] font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>Crear cuenta</Link>
        </div>
      </Mensaje>
    );
  }

  if (user.email?.toLowerCase() !== inv.email) {
    return (
      <Mensaje
        titulo="Esta invitación es para otra cuenta"
        texto={`La invitación fue enviada a ${inv.email}. Cerrá sesión e ingresá con esa cuenta para aceptarla.`}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Mensaje
        titulo="Te invitaron a una causa"
        texto={`${quien} te invitó a colaborar en "${causa?.caratula ?? "una causa"}".`}
      />
      {error && (
        <p className="text-[13px]" style={{ color: "var(--color-red)" }}>
          {error === "cuenta" ? "Esta invitación es para otra cuenta." : "No se pudo aceptar la invitación. Probá de nuevo."}
        </p>
      )}
      <form action={aceptarInvitacion}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="rounded-[8px] bg-blue px-5 py-[10px] text-[14px] font-semibold text-on-primary hover:opacity-90">
          Aceptar invitación
        </button>
      </form>
    </div>
  );
}
