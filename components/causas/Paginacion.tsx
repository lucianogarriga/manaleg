"use client";

export const CAUSAS_POR_PAGINA = 20;

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onChange: (pagina: number) => void;
}

// Números de página con elipsis: siempre muestra la primera, la última y las vecinas de la actual.
function rango(actual: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const salida: (number | "…")[] = [1];
  const ini = Math.max(2, actual - 1);
  const fin = Math.min(total - 1, actual + 1);
  if (ini > 2) salida.push("…");
  for (let p = ini; p <= fin; p++) salida.push(p);
  if (fin < total - 1) salida.push("…");
  salida.push(total);
  return salida;
}

const botonBase = "cursor-pointer rounded-[7px] border px-[10px] py-[5px] text-[13px] font-semibold transition-colors disabled:cursor-default disabled:opacity-40";

export default function Paginacion({ pagina, totalPaginas, total, porPagina, onChange }: Props) {
  if (totalPaginas <= 1) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <nav aria-label="Paginación de causas" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
      <span className="text-muted">Mostrando {desde}–{hasta} de {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)}
          className={`${botonBase} border-border bg-card text-sub hover:bg-bg`}>
          Anterior
        </button>
        {rango(pagina, totalPaginas).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-2 text-muted">…</span>
          ) : (
            <button key={p} type="button" aria-current={p === pagina ? "page" : undefined} onClick={() => onChange(p)}
              className={`${botonBase} min-w-[34px] ${p === pagina ? "border-blue bg-blue-lt text-blue" : "border-border bg-card text-sub hover:bg-bg"}`}>
              {p}
            </button>
          ),
        )}
        <button type="button" disabled={pagina >= totalPaginas} onClick={() => onChange(pagina + 1)}
          className={`${botonBase} border-border bg-card text-sub hover:bg-bg`}>
          Siguiente
        </button>
      </div>
    </nav>
  );
}
