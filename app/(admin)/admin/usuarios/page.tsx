import { Encabezado, ErrorCarga, Panel, Tarjeta } from "@/components/admin/Primitivas";
import { BarrasHorizontales, Dona } from "@/components/admin/Graficos";
import { cargarMetricas } from "@/services/admin/metricas";

export default async function UsuariosAdmin() {
  let m;
  try {
    m = await cargarMetricas("usuarios");
  } catch (e) {
    return <ErrorCarga mensaje={e instanceof Error ? e.message : "No se pudieron cargar las métricas."} />;
  }

  return (
    <>
      <Encabezado titulo="Usuarios" descripcion="Distribución por plan y estado de pago. Sin identificar a nadie." />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Tarjeta titulo="Total" valor={m.usuarios.total} />
        <Tarjeta titulo="Nuevos 30 días" valor={m.usuarios.nuevos30} />
      </section>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel titulo="Por plan">
          <Dona datos={Object.entries(m.usuarios.porPlan).map(([etiqueta, valor]) => ({ etiqueta, valor }))} />
        </Panel>
        <Panel titulo="Por estado de pago">
          <Dona datos={Object.entries(m.usuarios.porEstadoPago).map(([etiqueta, valor]) => ({ etiqueta, valor }))} />
        </Panel>
      </div>
    </>
  );
}
