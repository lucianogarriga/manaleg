import { Encabezado, ErrorCarga, Panel, Tarjeta } from "@/components/admin/Primitivas";
import { BarrasHorizontales } from "@/components/admin/Graficos";
import { cargarMetricas } from "@/services/admin/metricas";

export default async function CausasAdmin() {
  let m;
  try {
    m = await cargarMetricas("causas");
  } catch (e) {
    return <ErrorCarga mensaje={e instanceof Error ? e.message : "No se pudieron cargar las métricas."} />;
  }

  const datos = Object.entries(m.causas.porEstado).map(([etiqueta, valor]) => ({ etiqueta, valor }));

  return (
    <>
      <Encabezado titulo="Causas" descripcion="Totales y promedios. Ninguna causa se muestra individualmente." />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Tarjeta titulo="Causas totales" valor={m.causas.total} />
        <Tarjeta titulo="Promedio por usuario" valor={m.causas.promedioPorUsuario ?? "—"} />
        <Tarjeta titulo="Mediana por usuario" valor={m.causas.medianaPorUsuario ?? "—"} />
      </section>
      <Panel titulo="Causas por estado" className="mt-4">
        <BarrasHorizontales datos={datos} />
      </Panel>
    </>
  );
}
