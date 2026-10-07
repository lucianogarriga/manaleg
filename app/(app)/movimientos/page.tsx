import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import OpenCausaButton from "@/components/causas/OpenCausaButton";
import EmptyState from "@/components/ui/EmptyState";
import MovimientoDescripcion from "@/components/movimientos/MovimientoDescripcion";
import { createClient } from "@/services/supabase/server";
import { formatDateTime, getInitials } from "@/utils/formatters";
import type { MovimientoConAutor } from "@/types";

type MovimientoConCausa = MovimientoConAutor & { causa: { id: string; caratula: string } | null };

const PAGE_SIZE = 20;
const MAX_PAGES = 2;

const PERIODOS = [
  { value: "1d", label: "Último día" },
  { value: "3d", label: "Últimos 3 días" },
  { value: "7d", label: "Últimos 7 días" },
] as const;

// Sin periodo explícito → 7 días por defecto
const DEFAULT_PERIODO = "7d";

function fechaDesde(periodo: string | undefined): string | null {
  const dias: Record<string, number> = { "1d": 1, "3d": 3, "7d": 7 };
  const d = periodo ? dias[periodo] : null;
  if (!d) return null;
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
}

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; page?: string }>;
}) {
  const { periodo: periodoParam, page: pageParam } = await searchParams;
  // Default: últimos 7 días; nunca sin límite
  const periodo = PERIODOS.find((p) => p.value === periodoParam)?.value ?? DEFAULT_PERIODO;
  const page = Math.min(Math.max(1, parseInt(pageParam ?? "1", 10) || 1), MAX_PAGES);
  const offset = (page - 1) * PAGE_SIZE;
  const desde = fechaDesde(periodo);

  const supabase = await createClient();

  let query = supabase
    .from("movimientos")
    .select(
      "*, autor:profiles!movimientos_autor_id_fkey(id, nombre_completo, email), causa:causas(id, caratula)",
      { count: "exact" },
    )
    .order("fecha", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (desde) query = query.gte("fecha", desde);

  const { data, error, count } = await query.returns<MovimientoConCausa[]>();

  if (error) throw new Error(`No se pudieron cargar los movimientos: ${error.message}`);

  const total = count ?? 0;
  const totalPages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGES);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const buildHref = (p: number, per?: string) => {
    const params = new URLSearchParams();
    const efectivo = per ?? periodo;
    if (efectivo && efectivo !== DEFAULT_PERIODO) params.set("periodo", efectivo);
    if (p > 1) params.set("page", String(p));
    const q = params.toString();
    return `/movimientos${q ? `?${q}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-[760px] p-3">
      {/* Filtros de periodo */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {PERIODOS.map((p) => (
          <Link
            key={p.value}
            href={buildHref(1, p.value)}
            className={`rounded-[20px] border px-[10px] py-[3px] text-[12px] font-medium transition-colors ${
              periodo === p.value ? "border-blue bg-blue text-white" : "border-border text-sub hover:bg-bg"
            }`}
          >
            {p.label}
          </Link>
        ))}
        {total > 0 && (
          <span className="ml-auto text-[12px] text-muted">
            {total > PAGE_SIZE * MAX_PAGES ? `+${PAGE_SIZE * MAX_PAGES}` : total} resultado{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={periodo ? "Sin actividad en este período" : "Todavía no hay movimientos"}
          description={
            periodo
              ? "Probá ampliar el rango de fechas."
              : "Cuando cargues movimientos en tus causas, vas a ver acá la actividad reciente."
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[7px] border border-border bg-card">
            <div className="border-b border-border px-[13px] py-[9px] text-[12px] font-bold tracking-[.4px] text-sub uppercase">
              Actividad reciente
            </div>
            {data.map((m) => {
              const autor = m.autor?.nombre_completo ?? m.autor?.email ?? "—";
              return (
                <div key={m.id} className="border-b border-border px-[13px] py-[10px] last:border-b-0">
                  {m.causa && (
                    <OpenCausaButton
                      causaId={m.causa.id}
                      className="mb-[2px] block max-w-full truncate text-[12.5px] font-semibold text-blue hover:underline"
                    >
                      {m.causa.caratula}
                    </OpenCausaButton>
                  )}
                  <MovimientoDescripcion text={m.descripcion} />
                  <div className="mt-[2px] text-[12px] text-muted">
                    {formatDateTime(m.fecha)} ·{" "}
                    <span title={autor}>
                      {getInitials(m.autor?.nombre_completo, autor[0]?.toUpperCase())}
                    </span>
                    {m.tipo && ` · ${m.tipo}`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <Link
                href={hasPrev ? buildHref(page - 1) : "#"}
                aria-disabled={!hasPrev}
                className={`flex items-center gap-1 rounded-[6px] border border-border px-3 py-[5px] text-[12px] font-medium transition-colors ${
                  hasPrev ? "text-text hover:bg-bg" : "pointer-events-none text-muted opacity-40"
                }`}
              >
                <ChevronLeft size={13} /> Anterior
              </Link>
              <span className="text-[12px] text-muted">
                Página {page} de {totalPages}
              </span>
              <Link
                href={hasNext ? buildHref(page + 1) : "#"}
                aria-disabled={!hasNext}
                className={`flex items-center gap-1 rounded-[6px] border border-border px-3 py-[5px] text-[12px] font-medium transition-colors ${
                  hasNext ? "text-text hover:bg-bg" : "pointer-events-none text-muted opacity-40"
                }`}
              >
                Siguiente <ChevronRight size={13} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
