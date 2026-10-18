import { Encabezado, ErrorCarga, Panel } from "@/components/admin/Primitivas";
import { BarrasHorizontales } from "@/components/admin/Graficos";
import { cargarMetricas } from "@/services/admin/metricas";

const ETIQUETAS: Record<string, string> = {
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

export default async function UsoAdmin() {
  let m;
  try {
    m = await cargarMetricas("uso");
  } catch (e) {
    return <ErrorCarga mensaje={e instanceof Error ? e.message : "No se pudieron cargar las métricas."} />;
  }

  const datos = Object.entries(m.uso)
    .map(([clave, v]) => ({
      etiqueta: ETIQUETAS[clave] ?? clave,
      valor: v.registros,
      detalle: `· ${v.usuarios} ${v.usuarios === 1 ? "usuario" : "usuarios"}`,
    }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <>
      <Encabezado titulo="Uso de la app" descripcion="Registros por sección y cantidad de usuarios que la usan. No hay detalle por persona." />
      <Panel titulo="Registros por sección">
        <BarrasHorizontales datos={datos} />
      </Panel>
    </>
  );
}
