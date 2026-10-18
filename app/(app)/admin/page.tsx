import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { createClient } from "@/services/supabase/server";
import MfaAdmin from "@/components/admin/MfaAdmin";

// Panel de super admin: solo lectura, sin datos personales.
// Acceso controlado en la base (es_admin + MFA aal2). Esta página solo muestra lo que la base devuelve.
export const metadata: Metadata = {
  title: "Panel admin",
  robots: { index: false, follow: false },
};

interface Metricas {
  usuarios: {
    total: number;
    nuevos7: number;
    nuevos30: number;
    enLinea: number;
    activos30: number;
    porPlan: Record<string, number>;
    porEstadoPago: Record<string, number>;
  };
  causas: {
    total: number;
    porEstado: Record<string, number>;
    promedioPorUsuario: number | null;
    medianaPorUsuario: number | null;
  };
  uso: Record<string, { registros: number; usuarios: number }>;
  registrosPorSemana: { semana: string; registros: number }[];
}

const ETIQUETAS_USO: Record<string, string> = {
  agenda: "Agenda (eventos)",
  vencimientos: "Vencimientos",
  recordatorios: "Recordatorios",
  movimientos: "Movimientos",
  clientes: "Clientes",
  honorarios: "Honorarios",
  pagos: "Pagos",
  gastos: "Gastos",
  tareas: "Tareas",
  partes: "Partes de la causa",
  compartidas: "Causas compartidas",
};

function Tarjeta({ titulo, valor, detalle }: { titulo: string; valor: number | string; detalle?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[12px] font-semibold uppercase tracking-[.6px] text-muted">{titulo}</div>
      <div className="mt-1 text-[26px] font-bold text-text">{valor}</div>
      {detalle && <div className="mt-0.5 text-[12px] text-sub">{detalle}</div>}
    </div>
  );
}

function Tabla({ titulo, filas }: { titulo: string; filas: [string, number][] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-[13px] font-semibold text-text">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-[12px] text-muted">Sin datos.</p>
      ) : (
        <table className="w-full text-[13px]">
          <tbody>
            {filas.map(([clave, n]) => (
              <tr key={clave} className="border-t border-border">
                <td className="py-1 text-sub">{clave}</td>
                <td className="py-1 text-right font-semibold text-text">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  // Quien no es admin no sabe que la ruta existe.
  if (!profile.es_admin) notFound();

  const supabase = await createClient();

  // Exige MFA verificado (aal2). Sin eso, la base no devuelve datos.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return <MfaAdmin />;
  }

  // Registra el acceso en la auditoría antes de leer nada.
  const { error: errAuditoria } = await supabase.rpc("registrar_acceso_admin", { p_seccion: "panel" });
  if (errAuditoria) notFound();

  const { data, error } = await supabase.rpc("admin_metricas");
  if (error || !data) {
    return <p className="p-6 text-[13px] text-red">No se pudieron cargar las métricas.</p>;
  }
  const m = data as Metricas;

  const estadoPorCausa = Object.entries(m.causas.porEstado) as [string, number][];
  const uso = Object.entries(m.uso);
  const maxSemana = Math.max(1, ...m.registrosPorSemana.map((s) => s.registros));

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6 p-4 md:p-6">
      <header>
        <h1 className="text-[20px] font-bold text-text">Panel de administración</h1>
        <p className="text-[12px] text-muted">Solo conteos agregados. No se muestran datos personales ni de clientes.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tarjeta titulo="Usuarios" valor={m.usuarios.total} />
        <Tarjeta titulo="En línea ahora" valor={m.usuarios.enLinea} detalle="Actividad en los últimos 5 min" />
        <Tarjeta titulo="Nuevos 7 días" valor={m.usuarios.nuevos7} />
        <Tarjeta titulo="Nuevos 30 días" valor={m.usuarios.nuevos30} />
        <Tarjeta titulo="Activos 30 días" valor={m.usuarios.activos30} />
        <Tarjeta titulo="Causas" valor={m.causas.total} />
        <Tarjeta titulo="Causas por usuario" valor={m.causas.promedioPorUsuario ?? "—"} detalle={`Mediana: ${m.causas.medianaPorUsuario ?? "—"}`} />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Tabla titulo="Usuarios por plan" filas={Object.entries(m.usuarios.porPlan)} />
        <Tabla titulo="Usuarios por estado de pago" filas={Object.entries(m.usuarios.porEstadoPago)} />
        <Tabla titulo="Causas por estado" filas={estadoPorCausa} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-text">Registros nuevos por semana (últimas 12)</h3>
        <div className="flex h-[120px] items-end gap-2">
          {m.registrosPorSemana.map((s) => (
            <div key={s.semana} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-blue"
                style={{ height: `${Math.round((s.registros / maxSemana) * 100)}%`, minHeight: s.registros ? 4 : 0 }}
                title={`${s.registros} registros`}
              />
              <span className="text-[10px] text-muted">{new Date(s.semana).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-text">Uso por sección</h3>
        <table className="w-full text-[13px]">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1">Sección</th>
              <th className="py-1 text-right">Registros</th>
              <th className="py-1 text-right">Usuarios que la usan</th>
            </tr>
          </thead>
          <tbody>
            {uso.map(([clave, v]) => (
              <tr key={clave} className="border-t border-border">
                <td className="py-1 text-sub">{ETIQUETAS_USO[clave] ?? clave}</td>
                <td className="py-1 text-right font-semibold text-text">{v.registros}</td>
                <td className="py-1 text-right text-text">{v.usuarios}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
