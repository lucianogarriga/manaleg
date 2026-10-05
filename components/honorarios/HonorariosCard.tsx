"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { removePago } from "@/app/(app)/causas/detailActions";
import CardSection, { CardAction } from "@/components/ui/CardSection";
import { useHonorario } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency, formatDate } from "@/utils/formatters";
import HonorarioForm from "./HonorarioForm";
import PagoForm from "./PagoForm";
import ProgressBar from "./ProgressBar";

export default function HonorariosCard({ causaId, naked = false }: { causaId: string; naked?: boolean }) {
  const router = useRouter();
  const { honorario, loading, error, reload } = useHonorario(causaId);
  const [modal, setModal] = useState<"acuerdo" | "pago" | null>(null);
  const showToast = useUIStore((s) => s.showToast);

  const afterChange = (message: string) => {
    setModal(null);
    showToast({ message });
    reload();
    router.refresh();
  };

  const onDeletePago = async (id: string) => {
    if (!confirm("¿Eliminar este pago? El monto cobrado se recalcula.")) return;
    const result = await removePago(id);
    if (result.error) return showToast({ message: result.error });
    afterChange(result.message ?? "Pago eliminado.");
  };

  const acordado = honorario?.monto_acordado ?? 0;
  const cobrado = honorario?.monto_cobrado ?? 0;
  const percent = acordado > 0 ? (cobrado / acordado) * 100 : 0;
  const pagos = honorario?.pagos ?? [];

  const action = honorario ? (
    <span className="flex items-center gap-3">
      <CardAction onClick={() => setModal("acuerdo")}>Editar</CardAction>
      <CardAction onClick={() => setModal("pago")}>+ Registrar pago</CardAction>
    </span>
  ) : (
    !loading && <CardAction onClick={() => setModal("acuerdo")}>+ Definir honorarios</CardAction>
  );

  const inner = loading ? (
    <div className="space-y-2 px-[13px] py-[14px]" aria-busy="true">
      <div className="h-[14px] w-3/5 animate-pulse rounded bg-border" />
      <div className="h-[5px] w-full animate-pulse rounded bg-border" />
    </div>
  ) : error ? (
    <p className="px-[13px] py-4 text-[13px] text-red">No se pudieron cargar los honorarios: {error}</p>
  ) : !honorario ? (
    <p className="px-[13px] py-4 text-[13.5px] text-muted">
      Todavía no definiste los honorarios de esta causa.
    </p>
  ) : (
    <>
      <div className="px-[13px] py-[11px]">
        <div className="mb-[7px] flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-[15px] font-bold text-text">
            Total acordado: {honorario.moneda === "USD" ? "USD " : ""}{formatCurrency(acordado)}
          </span>
          <span className="text-[13.5px] font-semibold text-grn">
            Cobrado: {honorario.moneda === "USD" ? "USD " : ""}{formatCurrency(cobrado)}
          </span>
        </div>
        <ProgressBar percent={percent} />
        <div className="text-[11px] text-muted">
          {Math.round(percent)}% cobrado · {pagos.length} {pagos.length === 1 ? "pago registrado" : "pagos registrados"} ·
          Saldo: {formatCurrency(honorario.saldo_pendiente)}
          {honorario.porcentaje !== null && ` · ${honorario.porcentaje}% del monto`}
          {honorario.moneda === "USD" && " · USD"}
        </div>
        {(honorario.monto_adicional || honorario.consulta_cobrada || honorario.notas_honorarios) && (
          <div className="mt-[6px] flex flex-wrap gap-x-3 gap-y-[2px] text-[11px] text-muted">
            {honorario.monto_adicional ? (
              <span>Adicional fijo: {honorario.moneda} {formatCurrency(honorario.monto_adicional)}</span>
            ) : null}
            {honorario.consulta_cobrada && (
              <span>
                Consulta: {honorario.monto_consulta ? `${honorario.moneda} ${formatCurrency(honorario.monto_consulta)}` : "cobrada"}
              </span>
            )}
            {honorario.notas_honorarios && (
              <span className="w-full italic">{honorario.notas_honorarios}</span>
            )}
          </div>
        )}
      </div>
      {pagos.map((p) => (
        <div key={p.id} className="group flex items-center gap-2 border-t border-border px-[14px] py-[5px]">
          <span className="w-[62px] shrink-0 text-[11px] text-muted">{formatDate(p.fecha_pago)}</span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-sub">{p.descripcion ?? "Pago"}</span>
          {p.comprobante_drive && (
            <a
              href={p.comprobante_drive}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir comprobante"
              className="flex text-muted hover:text-blue"
            >
              <ExternalLink size={11} />
            </a>
          )}
          <span className="text-[13.5px] font-semibold text-grn">+{formatCurrency(p.monto)}</span>
          <button
            type="button"
            onClick={() => onDeletePago(p.id)}
            aria-label="Eliminar pago"
            className="flex cursor-pointer text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red focus:opacity-100"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}
    </>
  );

  return (
    <>
      {naked ? (
        <div>
          {!loading && (
            <div className="flex justify-end gap-3 px-[13px] pb-2 pt-1">
              {honorario ? (
                <>
                  <button type="button" onClick={() => setModal("acuerdo")} className="cursor-pointer text-[13px] font-semibold text-blue hover:underline">Editar</button>
                  <button type="button" onClick={() => setModal("pago")} className="cursor-pointer text-[13px] font-semibold text-blue hover:underline">+ Registrar pago</button>
                </>
              ) : (
                <button type="button" onClick={() => setModal("acuerdo")} className="cursor-pointer text-[13px] font-semibold text-blue hover:underline">+ Definir honorarios</button>
              )}
            </div>
          )}
          {inner}
        </div>
      ) : (
        <CardSection title="Honorarios" action={action}>
          {inner}
        </CardSection>
      )}

      {modal === "acuerdo" && (
        <HonorarioForm causaId={causaId} honorario={honorario} onClose={() => setModal(null)} onSaved={afterChange} />
      )}
      {modal === "pago" && honorario && (
        <PagoForm
          causaId={causaId}
          honorarioId={honorario.id}
          saldo={honorario.saldo_pendiente}
          onClose={() => setModal(null)}
          onSaved={() => afterChange("Pago registrado.")}
        />
      )}
    </>
  );
}
