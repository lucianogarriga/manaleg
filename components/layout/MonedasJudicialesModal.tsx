"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { eliminarMonedaJudicial } from "@/app/(app)/ajustes/actions";
import FormularioMoneda from "./FormularioMoneda";
import { useMonedasJudiciales } from "@/store/monedasJudicialesStore";
import { useUIStore } from "@/store/uiStore";
import type { MonedaJudicial } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";

export default function MonedasJudicialesModal({ onClose }: { onClose: () => void }) {
  const monedas = useMonedasJudiciales((s) => s.monedas);
  const setMonedas = useMonedasJudiciales((s) => s.setMonedas);
  const showToast = useUIStore((s) => s.showToast);
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();
  const [editando, setEditando] = useState<MonedaJudicial | null>(null);
  const [agregando, setAgregando] = useState(false);

  const borrar = async (m: MonedaJudicial) => {
    const ok = await confirmRequest({
      title: "Eliminar moneda judicial",
      message: `¿Eliminar ${m.nombre}? Los honorarios ya cargados con esta moneda conservan su cotización.`,
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    const r = await eliminarMonedaJudicial(m.id);
    if (r.error) return showToast({ message: r.error });
    setMonedas(monedas.filter((x) => x.id !== m.id));
  };

  const formulario = editando || agregando;

  return (
    <Modal open title="Monedas judiciales" onClose={onClose}
      footer={<div className="flex justify-end"><button type="button" onClick={onClose} className="cursor-pointer rounded-[6px] px-3 py-[6px] text-[13px] text-sub hover:text-text">Cerrar</button></div>}
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-[13px] text-sub">
          Valores de referencia de uso judicial. Actualizalos a mano cada 30 o 60 días.
        </p>

        {monedas.length > 0 && (
          <ul className="flex flex-col divide-y divide-border rounded-[8px] border border-border">
            {monedas.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-text">{m.nombre}{m.referencia ? <span className="font-normal text-muted"> · {m.referencia}</span> : null}</div>
                  <div className="text-[12px] text-muted">{formatCurrency(m.valor, "ARS")} · actualizado {formatDate(m.valor_fecha)}</div>
                </div>
                <button type="button" onClick={() => { setAgregando(false); setEditando(m); }} className="cursor-pointer text-[12px] font-semibold text-blue hover:underline">Editar</button>
                <button type="button" onClick={() => borrar(m)} className="cursor-pointer text-[12px] font-semibold text-muted hover:text-red">Eliminar</button>
              </li>
            ))}
          </ul>
        )}

        {formulario ? (
          <div className="rounded-[8px] border border-border p-3">
            <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[.4px] text-sub">{editando ? "Editar moneda" : "Agregar moneda"}</div>
            <FormularioMoneda
              key={editando?.id ?? "nueva"}
              inicial={editando}
              onHecho={() => { setEditando(null); setAgregando(false); }}
              onCancelar={() => { setEditando(null); setAgregando(false); }}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setAgregando(true)} className="cursor-pointer self-start text-[13px] font-semibold text-blue hover:underline">
            + Agregar moneda
          </button>
        )}
      </div>
      {confirmDialog}
    </Modal>
  );
}
