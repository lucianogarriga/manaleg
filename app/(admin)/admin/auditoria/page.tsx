import { Encabezado, ErrorCarga, Panel } from "@/components/admin/Primitivas";
import { cargarMisAccesos } from "@/services/admin/metricas";

export default async function AuditoriaAdmin() {
  let accesos;
  try {
    accesos = await cargarMisAccesos();
  } catch (e) {
    return <ErrorCarga mensaje={e instanceof Error ? e.message : "No se pudo cargar la auditoría."} />;
  }

  return (
    <>
      <Encabezado titulo="Auditoría" descripcion="Tus últimos 50 accesos al panel de administración." />
      <Panel titulo="Accesos recientes">
        {accesos.length === 0 ? (
          <p className="text-[12px] text-muted">Sin accesos registrados.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1">Fecha y hora</th>
                <th className="py-1">Sección</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map((a, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1 text-sub">{new Date(a.creado_at).toLocaleString("es-AR")}</td>
                  <td className="py-1 text-text">{a.seccion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
