import { Wallet } from "lucide-react";
import OpenCausaButton from "@/components/causas/OpenCausaButton";
import ProgressBar from "@/components/honorarios/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/ui/StatCard";
import { createClient } from "@/services/supabase/server";
import { formatCurrency } from "@/utils/formatters";
import type { Honorario } from "@/types";

type HonorarioConCausa = Honorario & { causa: { id: string; caratula: string } | null };

// Resumen de honorarios de todas las causas
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
        description="Entrá a una causa y tocá “+ Definir honorarios” para empezar a registrar acuerdos y pagos."
      />
    );
  }

  const acordado = data.reduce((sum, h) => sum + h.monto_acordado, 0);
  const cobrado = data.reduce((sum, h) => sum + h.monto_cobrado, 0);
  const percent = acordado > 0 ? Math.round((cobrado / acordado) * 100) : 0;

  return (
    <div className="mx-auto max-w-[900px] p-3">
      <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-3">
        <StatCard label="Total acordado" value={formatCurrency(acordado)} tone="blue" small />
        <StatCard label="Cobrado" value={formatCurrency(cobrado)} hint={`${percent}% del total`} tone="grn" small />
        <StatCard label="Saldo pendiente" value={formatCurrency(acordado - cobrado)} tone="amb" small />
      </div>

      <div className="mt-3 overflow-hidden rounded-[7px] border border-border bg-card">
        <div className="border-b border-border px-[13px] py-[9px] text-[12px] font-bold tracking-[.4px] text-sub uppercase">
          Honorarios por causa ({data.length})
        </div>
        {data.map((h) => (
          <div key={h.id} className="border-b border-slate-100 px-[13px] py-[10px] last:border-b-0">
            <div className="mb-[6px] flex flex-wrap items-baseline justify-between gap-x-3">
              {h.causa ? (
                <OpenCausaButton causaId={h.causa.id} className="min-w-0 truncate text-[13.5px] font-semibold text-text hover:text-blue">
                  {h.causa.caratula}
                </OpenCausaButton>
              ) : (
                <span className="text-[13.5px] text-muted">Causa no disponible</span>
              )}
              <span className="text-[13px] text-sub">
                <span className="font-semibold text-grn">{formatCurrency(h.monto_cobrado)}</span> de{" "}
                {formatCurrency(h.monto_acordado)}
              </span>
            </div>
            <ProgressBar percent={h.monto_acordado > 0 ? (h.monto_cobrado / h.monto_acordado) * 100 : 0} />
            <div className="text-[11px] text-muted">Saldo: {formatCurrency(h.saldo_pendiente)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
