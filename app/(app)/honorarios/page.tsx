import { Wallet } from "lucide-react";
import OpenCausaButton from "@/components/causas/OpenCausaButton";
import ProgressBar from "@/components/honorarios/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/ui/StatCard";
import { createClient } from "@/services/supabase/server";
import { formatCurrency } from "@/utils/formatters";
import { monedasPresentes, totalesPorMoneda } from "@/utils/honorarios";
import type { Honorario } from "@/types";

type HonorarioConCausa = Honorario & { causa: { id: string; caratula: string } | null };

// Resumen de honorarios de todas las causas. Los totales van separados por moneda.
export default async function HonorariosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("honorarios")
    .select("*, causa:causas(id, caratula)")
    .order("created_at", { ascending: false })
    .returns<HonorarioConCausa[]>();

  if (error) throw new Error(`No se pudieron cargar los honorarios: ${error.message}`);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Todavía no definiste honorarios"
        description="Entrá a una causa y tocá “+ Nuevo honorario” para empezar a registrar acuerdos y pagos."
      />
    );
  }

  const totales = totalesPorMoneda(data);
  const monedas = monedasPresentes(data);

  return (
    <div className="mx-auto max-w-[900px] p-3">
      {monedas.map((m) => {
        const t = totales[m];
        const percent = t.acordado > 0 ? Math.round((t.cobrado / t.acordado) * 100) : 0;
        return (
          <div key={m} className="mb-3">
            <div className="mb-[6px] text-[11px] font-bold tracking-[.4px] text-sub uppercase">{m}</div>
            <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-3">
              <div className="fade-in-up" style={{ animationDelay: "0ms" }}>
                <StatCard label="Total acordado" value={formatCurrency(t.acordado, m)} tone="blue" small />
              </div>
              <div className="fade-in-up" style={{ animationDelay: "80ms" }}>
                <StatCard label="Cobrado" value={formatCurrency(t.cobrado, m)} hint={`${percent}% del total`} tone="grn" small />
              </div>
              <div className="fade-in-up" style={{ animationDelay: "160ms" }}>
                <StatCard label="Saldo pendiente" value={formatCurrency(t.saldo, m)} tone="amb" small />
              </div>
            </div>
          </div>
        );
      })}

      <div className="fade-in-up mt-3 overflow-hidden rounded-[7px] border border-border bg-card" style={{ animationDelay: "240ms" }}>
        <div className="border-b border-border px-[13px] py-[9px] text-[12px] font-bold tracking-[.4px] text-sub uppercase">
          Honorarios por causa ({data.length})
        </div>
        {data.map((h) => {
          const moneda = h.moneda === "USD" ? "USD" : "ARS";
          const esMensual = h.periodicidad === "mensual";
          return (
            <div key={h.id} className="border-b border-slate-100 px-[13px] py-[10px] last:border-b-0">
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
        })}
      </div>
    </div>
  );
}
