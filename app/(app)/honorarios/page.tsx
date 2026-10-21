import Link from "next/link";
import { Wallet } from "lucide-react";
import OpenCausaButton from "@/components/causas/OpenCausaButton";
import ProgressBar from "@/components/honorarios/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/ui/StatCard";
import { createClient } from "@/services/supabase/server";
import type { Honorario } from "@/types";
import { formatCurrency } from "@/utils/formatters";
import { monedaDeHonorario } from "@/utils/honorarios";

type HonorarioConCausa = Honorario & { causa: { id: string; caratula: string } | null };

interface TotalFila {
  moneda: "ARS" | "USD" | "JUS";
  acordado: number;
  cobrado: number;
  saldo: number;
}

const PAGE_SIZE = 10;
const MAX_LISTADOS = 50; // la lista muestra hasta 50 honorarios; los totales salen de la base sobre todos

export default async function HonorariosPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const { pagina: paginaRaw } = await searchParams;
  const pagina = Math.max(1, Number.parseInt(paginaRaw ?? "1", 10) || 1);
  const desde = (pagina - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const [{ data: totalesData, error: totalesError }, { data, count, error }] = await Promise.all([
    supabase.rpc("totales_honorarios"),
    supabase
      .from("honorarios")
      .select("*, causa:causas(id, caratula)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(desde, desde + PAGE_SIZE - 1)
      .returns<HonorarioConCausa[]>(),
  ]);

  if (totalesError) throw new Error(`No se pudieron calcular los totales: ${totalesError.message}`);
  if (error) throw new Error(`No se pudieron cargar los honorarios: ${error.message}`);

  const total = count ?? 0;
  const listados = Math.min(total, MAX_LISTADOS);
  if (total === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Todavía no definiste honorarios"
        description="Entrá a una causa y tocá “+ Nuevo honorario” para empezar a registrar acuerdos y pagos."
      />
    );
  }

  const totalPaginas = Math.ceil(listados / PAGE_SIZE);
  return (
    <div className="mx-auto max-w-[900px] p-3">
      {((totalesData ?? []) as TotalFila[]).map((t) => {
        const percent = t.acordado > 0 ? Math.round((t.cobrado / t.acordado) * 100) : 0;
        return (
          <div key={t.moneda} className="mb-3">
            <div className="mb-[6px] text-[11px] font-bold tracking-[.4px] text-sub uppercase">{t.moneda}</div>
            <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-3">
              <div className="fade-in-up" style={{ animationDelay: "0ms" }}>
                <StatCard label="Total acordado" value={formatCurrency(t.acordado, t.moneda)} tone="blue" small />
              </div>
              <div className="fade-in-up" style={{ animationDelay: "80ms" }}>
                <StatCard label="Cobrado" value={formatCurrency(t.cobrado, t.moneda)} hint={`${percent}% del total`} tone="grn" small />
              </div>
              <div className="fade-in-up" style={{ animationDelay: "160ms" }}>
                <StatCard label="Saldo pendiente" value={formatCurrency(t.saldo, t.moneda)} tone="amb" small />
              </div>
            </div>
          </div>
        );
      })}

      <div className="fade-in-up mt-3 overflow-hidden rounded-[7px] border border-border bg-card" style={{ animationDelay: "240ms" }}>
        <div className="border-b border-border px-[13px] py-[9px] text-[12px] font-bold tracking-[.4px] text-sub uppercase">
          Honorarios{total > MAX_LISTADOS ? ` (mostrando ${listados} de ${total})` : ` (${total})`}
        </div>
        {filasDePagina(data ?? [])}
      </div>

      {totalPaginas > 1 && (
        <nav className="mt-3 flex items-center justify-between text-[13px]" aria-label="Paginación de honorarios">
          {pagina > 1 ? (
            <Link href={`/honorarios?pagina=${pagina - 1}`} className="font-semibold text-blue hover:underline">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link href={`/honorarios?pagina=${pagina + 1}`} className="font-semibold text-blue hover:underline">
              Siguiente →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

function filasDePagina(items: HonorarioConCausa[]) {
  return items.map((h) => {
    const moneda = monedaDeHonorario(h.moneda);
    const esMensual = h.periodicidad === "mensual";
    return (
      <div key={h.id} className={`border-b border-slate-100 px-[13px] py-[10px] last:border-b-0 ${h.anulado ? "opacity-60" : ""}`}>
        <div className="mb-[6px] flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="min-w-0 truncate text-[13.5px]">
            {h.causa ? (
              <OpenCausaButton causaId={h.causa.id} className="font-semibold text-text hover:text-blue">
                {h.causa.caratula}
              </OpenCausaButton>
            ) : (
              <span className="text-muted">Causa no disponible</span>
            )}
            <span className="ml-2 text-[12px] text-muted">· {h.concepto} · {moneda}</span>
            {h.anulado && <span className="ml-2 rounded-[4px] bg-red-100 px-[5px] py-px text-[10px] font-semibold text-red-600">ANULADO</span>}
          </span>
          <span className="text-[13px] text-sub">
            <span className="font-semibold text-grn">{formatCurrency(h.monto_cobrado, moneda)}</span>
            {esMensual ? ` cobrado · cuota ${formatCurrency(h.monto_acordado, moneda)}` : ` de ${formatCurrency(h.monto_acordado, moneda)}`}
          </span>
        </div>
        {!esMensual && (
          <>
            <ProgressBar percent={h.monto_acordado > 0 ? (h.monto_cobrado / h.monto_acordado) * 100 : 0} />
            <div className="text-[11px] text-muted">Saldo: {formatCurrency(h.saldo_pendiente, moneda)}</div>
          </>
        )}
      </div>
    );
  });
}
