// Bloques de presentación del panel de admin.

export function Tarjeta({ titulo, valor, detalle }: { titulo: string; valor: number | string; detalle?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[.6px] text-muted">{titulo}</div>
      <div className="mt-1 text-[26px] font-bold text-text">{valor}</div>
      {detalle && <div className="mt-0.5 text-[12px] text-sub">{detalle}</div>}
    </div>
  );
}

export function Panel({ titulo, children, className = "" }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <h2 className="mb-3 text-[13px] font-semibold text-text">{titulo}</h2>
      {children}
    </section>
  );
}

export function Encabezado({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-[20px] font-bold text-text">{titulo}</h1>
      <p className="text-[12px] text-muted">{descripcion}</p>
    </header>
  );
}

export function ErrorCarga({ mensaje }: { mensaje: string }) {
  return <p className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-[13px] text-red">{mensaje}</p>;
}
