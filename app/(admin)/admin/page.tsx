import { Encabezado, ErrorCarga, Panel, Tarjeta } from "@/components/admin/Primitivas";
import { BarrasVerticales, Dona } from "@/components/admin/Graficos";
import { cargarMetricas } from "@/services/admin/metricas";

export default async function ResumenAdmin() {
  let m;
  try {
    m = await cargarMetricas("resumen");
  } catch (e) {
    return <ErrorCarga mensaje={e instanceof Error ? e.message : "No se pudieron cargar las métricas."} />;
  }

  return (
    <>
      <Encabezado titulo="Resumen" descripcion="Solo conteos agregados. No se muestran datos personales ni de clientes." />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tarjeta titulo="Usuarios" valor={m.usuarios.total} />
        <Tarjeta titulo="En línea ahora" valor={m.usuarios.enLinea} detalle="Actividad en los últimos 5 min" />
        <Tarjeta titulo="Nuevos 7 días" valor={m.usuarios.nuevos7} />
        <Tarjeta titulo="Nuevos 30 días" valor={m.usuarios.nuevos30} />
      </section>
      <Panel titulo="Registros nuevos por semana (últimas 12)" className="mt-4">
        <BarrasVerticales
          etiquetaSemana
          datos={m.registrosPorSemana.map((s) => ({ etiqueta: s.semana, valor: s.registros }))}
        />
      </Panel>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel titulo="Usuarios por plan">
          <Dona datos={Object.entries(m.usuarios.porPlan).map(([etiqueta, valor]) => ({ etiqueta, valor }))} />
        </Panel>
        <Panel titulo="Causas por estado">
          <Dona datos={Object.entries(m.causas.porEstado).map(([etiqueta, valor]) => ({ etiqueta, valor }))} />
        </Panel>
      </div>
    </>
  );
}
