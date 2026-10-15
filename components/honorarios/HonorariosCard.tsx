"use client";

import { useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { anularHonorario, anularPago, deleteHonorario, deletePago } from "@/app/(app)/causas/detailActions";
import CardSection, { CardAction } from "@/components/ui/CardSection";
import { useHonorarios } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import type { HonorarioConPagos } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { monedasPresentes, totalesPorMoneda, type MonedaHonorario } from "@/utils/honorarios";
import AnularForm from "./AnularForm";
import HonorarioForm from "./HonorarioForm";
import PagoForm from "./PagoForm";
import ProgressBar from "./ProgressBar";

type Modal =
  | { tipo: "nuevo" }
  | { tipo: "editar"; honorario: HonorarioConPagos }
  | { tipo: "pago"; honorario: HonorarioConPagos }
  | { tipo: "anular-honorario"; honorario: HonorarioConPagos }
  | { tipo: "anular-pago"; pagoId: string; concepto: string }
  | null;

function etiquetaPeriodicidad(h: HonorarioConPagos): string {
  if (h.periodicidad === "unico") return "Pago único";
  if (h.cuotas_mensuales) return `Mensual · ${h.cuotas_mensuales} cuotas`;
  return "Mensual · indefinido";
}

export default function HonorariosCard({ causaId, naked = false }: { causaId: string; naked?: boolean }) {
  const router = useRouter();
  const { data: honorarios, loading, error, reload } = useHonorarios(causaId);
  const [modal, setModal] = useState<Modal>(null);
  const showToast = useUIStore((s) => s.showToast);
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();

  const afterChange = (message: string) => {
    setModal(null);
    showToast({ message });
    reload();
    router.refresh();
  };

  const onDeletePago = async (id: string) => {
    const ok = await confirmRequest({ title: "Eliminar pago", message: "¿Eliminar este pago? El monto cobrado se recalcula.", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    const result = await deletePago(id);
    if (result.error) return showToast({ message: result.error });
    afterChange(result.message ?? "Pago eliminado.");
  };

  const onDeleteHonorario = async (h: HonorarioConPagos) => {
    const ok = await confirmRequest({
      title: "Eliminar honorario",
      message: `¿Eliminar "${h.concepto}"? Se borran también sus pagos. No se puede deshacer.`,
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteHonorario(h.id);
    if (result.error) return showToast({ message: result.error });
    afterChange(result.message ?? "Honorario eliminado.");
  };

  const lista = honorarios ?? [];
  const totales = totalesPorMoneda(lista);
  const monedas = monedasPresentes(lista.filter((h) => !h.anulado));

  const botonNuevo = <CardAction onClick={() => setModal({ tipo: "nuevo" })}>+ Nuevo honorario</CardAction>;

  const inner = loading ? (
    <div className="space-y-2 px-[13px] py-[14px]" aria-busy="true">
      <div className="h-[14px] w-3/5 animate-pulse rounded bg-border" />
      <div className="h-[5px] w-full animate-pulse rounded bg-border" />
    </div>
  ) : error ? (
    <p className="px-[13px] py-4 text-[13px] text-red">No se pudieron cargar los honorarios: {error}</p>
  ) : lista.length === 0 ? (
    <p className="px-[13px] py-4 text-[13.5px] text-muted">Todavía no definiste honorarios para esta causa.</p>
  ) : (
    <>
      <div className="space-y-[6px] px-[13px] py-[11px]">
        {monedas.map((m: MonedaHonorario) => (
          <div key={m} className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]">
            <span className="font-semibold text-text">Total acordado: {formatCurrency(totales[m].acordado, m)}</span>
            <span className="font-semibold text-grn">Cobrado: {formatCurrency(totales[m].cobrado, m)}</span>
            <span className="text-muted">Saldo: {formatCurrency(totales[m].saldo, m)}</span>
          </div>
        ))}
      </div>

      {lista.map((h) => {
        const moneda = h.moneda === "USD" ? "USD" : "ARS";
        const esMensual = h.periodicidad === "mensual";
        const percent = !esMensual && h.monto_acordado > 0 ? (h.monto_cobrado / h.monto_acordado) * 100 : 0;
        const pagos = h.pagos ?? [];
        const activos = pagos.filter((p) => !p.anulado);
        return (
          <div key={h.id} className={`border-t border-border px-[13px] py-[11px] ${h.anulado ? "opacity-60" : ""}`}>
            <div className="mb-[6px] flex flex-wrap items-baseline justify-between gap-x-3">
              <span className={`text-[14px] font-bold text-text ${h.anulado ? "line-through" : ""}`}>
                {h.concepto} <span className="ml-1 text-[11px] font-normal text-muted">{etiquetaPeriodicidad(h)} · {moneda}</span>
                {h.anulado && <span className="ml-2 rounded-[4px] bg-red-100 px-[5px] py-px text-[10px] font-semibold text-red-600 no-underline">ANULADO</span>}
              </span>
              <span className="flex items-center gap-3">
                {!h.anulado && (
                  <>
                    <button type="button" onClick={() => setModal({ tipo: "editar", honorario: h })} className="cursor-pointer text-[12px] font-semibold text-blue hover:underline">Editar</button>
                    <button type="button" onClick={() => setModal({ tipo: "pago", honorario: h })} className="cursor-pointer text-[12px] font-semibold text-blue hover:underline">+ Registrar pago</button>
                    <button type="button" onClick={() => setModal({ tipo: "anular-honorario", honorario: h })} className="cursor-pointer text-[12px] font-semibold text-muted hover:text-red hover:underline">Anular</button>
                  </>
                )}
                <button type="button" onClick={() => onDeleteHonorario(h)} aria-label="Eliminar honorario" className="flex cursor-pointer text-muted hover:text-red">
                  <Trash2 size={12} />
                </button>
              </span>
            </div>

            {h.anulado && h.motivo_anulacion && <div className="mb-[4px] text-[11px] italic text-muted">Motivo: {h.motivo_anulacion}</div>}

            {esMensual ? (
              <div className="text-[12.5px] text-sub">
                Cuota: {formatCurrency(h.monto_acordado, moneda)} · Cobrado: <span className="font-semibold text-grn">{formatCurrency(h.monto_cobrado, moneda)}</span> ·{" "}
                {h.cuotas_mensuales ? `${activos.length} de ${h.cuotas_mensuales} pagos` : `${activos.length} ${activos.length === 1 ? "pago" : "pagos"} registrados`}
              </div>
            ) : (
              <>
                <div className="mb-[5px] text-[12.5px] text-sub">
                  Acordado: {formatCurrency(h.monto_acordado, moneda)} · Cobrado: <span className="font-semibold text-grn">{formatCurrency(h.monto_cobrado, moneda)}</span> · Saldo: {formatCurrency(h.saldo_pendiente, moneda)}
                </div>
                <ProgressBar percent={percent} />
                <div className="text-[11px] text-muted">
                  {Math.round(percent)}% cobrado · {activos.length} {activos.length === 1 ? "pago registrado" : "pagos registrados"}
                  {h.porcentaje !== null && ` · ${h.porcentaje}% del monto`}
                </div>
              </>
            )}

            {(h.monto_adicional || h.consulta_cobrada || h.notas_honorarios) && (
              <div className="mt-[6px] flex flex-wrap gap-x-3 gap-y-[2px] text-[11px] text-muted">
                {h.monto_adicional ? <span>Adicional fijo: {formatCurrency(h.monto_adicional, moneda)}</span> : null}
                {h.consulta_cobrada && <span>Consulta: {h.monto_consulta ? formatCurrency(h.monto_consulta, moneda) : "cobrada"}</span>}
                {h.notas_honorarios && <span className="w-full italic">{h.notas_honorarios}</span>}
              </div>
            )}

            {pagos.map((p) => (
              <div key={p.id} className={`group mt-[6px] flex items-center gap-2 border-t border-border pt-[5px] ${p.anulado ? "opacity-50" : ""}`}>
                <span className="w-[62px] shrink-0 text-[11px] text-muted">{formatDate(p.fecha_pago)}</span>
                <span className={`min-w-0 flex-1 truncate text-[13px] text-sub ${p.anulado ? "line-through" : ""}`}>
                  {p.descripcion ?? "Pago"}
                  {p.anulado && <span className="ml-2 text-[11px] italic no-underline">anulado: {p.motivo_anulacion}</span>}
                </span>
                {p.comprobante_drive && (
                  <a href={p.comprobante_drive} target="_blank" rel="noopener noreferrer" aria-label="Abrir comprobante" className="flex text-muted hover:text-blue">
                    <ExternalLink size={11} />
                  </a>
                )}
                <span className={`text-[13.5px] font-semibold ${p.anulado ? "text-muted line-through" : "text-grn"}`}>+{formatCurrency(p.monto, moneda)}</span>
                {!p.anulado && (
                  <button
                    type="button"
                    onClick={() => setModal({ tipo: "anular-pago", pagoId: p.id, concepto: p.descripcion ?? "Pago" })}
                    className="cursor-pointer text-[11px] text-muted opacity-0 transition-opacity hover:text-red hover:underline group-hover:opacity-100 focus:opacity-100"
                  >
                    Anular
                  </button>
                )}
                <button type="button" onClick={() => onDeletePago(p.id)} aria-label="Eliminar pago" className="flex cursor-pointer text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red focus:opacity-100">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );

  return (
    <>
      {naked ? (
        <div>
          {!loading && <div className="flex justify-end px-[13px] pb-2 pt-1">{botonNuevo}</div>}
          {inner}
        </div>
      ) : (
        <CardSection title="Honorarios" action={botonNuevo}>
          {inner}
        </CardSection>
      )}

      {modal?.tipo === "nuevo" && (
        <HonorarioForm causaId={causaId} honorario={null} onClose={() => setModal(null)} onSaved={afterChange} />
      )}
      {modal?.tipo === "editar" && (
        <HonorarioForm causaId={causaId} honorario={modal.honorario} onClose={() => setModal(null)} onSaved={afterChange} />
      )}
      {modal?.tipo === "pago" && (
        <PagoForm
          causaId={causaId}
          honorarioId={modal.honorario.id}
          moneda={modal.honorario.moneda === "USD" ? "USD" : "ARS"}
          saldo={modal.honorario.periodicidad === "unico" ? modal.honorario.saldo_pendiente : null}
          onClose={() => setModal(null)}
          onSaved={() => afterChange("Pago registrado.")}
        />
      )}
      {modal?.tipo === "anular-honorario" && (
        <AnularForm
          titulo="Anular honorario"
          mensaje={`"${modal.honorario.concepto}" dejará de sumar en los totales. Queda registrado en la causa como anulado.`}
          onClose={() => setModal(null)}
          onConfirm={async (motivo) => {
            const r = await anularHonorario(modal.honorario.id, motivo);
            if (r.error) return r.error;
            afterChange(r.message ?? "Honorario anulado.");
            return null;
          }}
        />
      )}
      {modal?.tipo === "anular-pago" && (
        <AnularForm
          titulo="Anular pago"
          mensaje={`Se anula el pago "${modal.concepto}" y el monto cobrado se recalcula.`}
          onClose={() => setModal(null)}
          onConfirm={async (motivo) => {
            const r = await anularPago(modal.pagoId, motivo);
            if (r.error) return r.error;
            afterChange(r.message ?? "Pago anulado.");
            return null;
          }}
        />
      )}
      {confirmDialog}
    </>
  );
}
