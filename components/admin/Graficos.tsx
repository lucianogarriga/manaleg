// Gráficos simples en SVG y CSS: sin librerías externas.

export function BarrasVerticales({ datos, etiquetaSemana }: { datos: { etiqueta: string; valor: number }[]; etiquetaSemana?: boolean }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <div className="flex h-[140px] items-end gap-2">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[11px] font-semibold text-text">{d.valor}</span>
          <div
            className="w-full rounded-t bg-blue"
            style={{ height: `${Math.round((d.valor / max) * 100)}%`, minHeight: d.valor ? 4 : 0 }}
          />
          <span className="text-[10px] text-muted">{etiquetaSemana ? formatearSemana(d.etiqueta) : d.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}

export function BarrasHorizontales({ datos }: { datos: { etiqueta: string; valor: number; detalle?: string }[] }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <div className="flex flex-col gap-2">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-sub">{d.etiqueta}</span>
            <span className="font-semibold text-text">
              {d.valor}
              {d.detalle && <span className="ml-2 font-normal text-muted">{d.detalle}</span>}
            </span>
          </div>
          <div className="h-[8px] w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-blue" style={{ width: `${Math.round((d.valor / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const COLORES = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#94a3b8"];

export function Dona({ datos }: { datos: { etiqueta: string; valor: number }[] }) {
  const total = datos.reduce((acc, d) => acc + d.valor, 0);
  const radio = 40;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-[120px] w-[120px] shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={radio} fill="none" stroke="var(--color-border)" strokeWidth="14" />
        {total > 0 &&
          datos.map((d, i) => {
            const largo = (d.valor / total) * circunferencia;
            const offset = acumulado;
            acumulado += largo;
            return (
              <circle
                key={d.etiqueta}
                cx="50"
                cy="50"
                r={radio}
                fill="none"
                stroke={COLORES[i % COLORES.length]}
                strokeWidth="14"
                strokeDasharray={`${largo} ${circunferencia - largo}`}
                strokeDashoffset={-offset}
              />
            );
          })}
      </svg>
      <ul className="flex flex-col gap-1 text-[12px]">
        {datos.map((d, i) => (
          <li key={d.etiqueta} className="flex items-center gap-2">
            <span className="inline-block h-[10px] w-[10px] rounded-sm" style={{ background: COLORES[i % COLORES.length] }} />
            <span className="text-sub">{d.etiqueta}</span>
            <span className="font-semibold text-text">{d.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatearSemana(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}
