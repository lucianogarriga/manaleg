// Loader de carga: anillo punteado, arco giratorio, punto en órbita y núcleo con la marca.
// Centrado en el alto visible de la sección.
// Los estilos están en globals.css (sp-*).
export default function Spinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] w-full flex-col items-center justify-center" role="status" aria-label={label}>
      <div className="sp-orb">
        <span className="sp-ring sp-ring-track" />
        <span className="sp-ring sp-ring-arc" />
        <span className="sp-ring sp-ring-orbit" />
        <span className="sp-core">M</span>
      </div>
      <span className="sp-label">{label}</span>
    </div>
  );
}
