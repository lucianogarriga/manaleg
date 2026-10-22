// Loader de carga: anillo de trazo punteado, arco que gira, punto en órbita y núcleo con la marca.
// Los estilos están en globals.css (sp-*).
export default function Spinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="mx-auto flex flex-col items-center py-12" role="status" aria-label={label}>
      <div className="sp-orb">
        <span className="sp-ring sp-ring-track" />
        <span className="sp-ring sp-ring-arc" />
        <span className="sp-ring sp-ring-orbit" />
        <span className="sp-core">M</span>
      </div>
      <span className="sp-label">{label}</span>
      <div className="sp-bars" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
