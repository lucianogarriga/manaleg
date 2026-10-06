"use client";

import { useActionState, useEffect, useTransition } from "react";
import { updateVencimiento } from "@/app/(app)/causas/detailActions";
import Modal from "@/components/ui/Modal";
import FormAlert from "@/components/auth/FormAlert";
import type { CausaConRelaciones, FormState } from "@/types";

const TIPOS_VENC = ["Vencimiento", "Recordatorio", "Audiencia"] as const;

export default function VencimientoForm({
  causa,
  onClose,
  onSaved,
}: {
  causa: CausaConRelaciones;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(updateVencimiento, {});
  const [, startSubmit] = useTransition();

  useEffect(() => {
    if (state.message) onSaved(state.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startSubmit(() => dispatch(new FormData(e.currentTarget)));
  };

  return (
    <Modal
      open
      title="Editar vencimiento / alerta"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose}
            className="ml-auto cursor-pointer rounded-[6px] border border-border bg-card px-3 py-[6px] text-[14px] font-medium text-sub hover:bg-bg">
            Cancelar
          </button>
          <button type="submit" form="venc-form" disabled={pending}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      }
    >
      <form id="venc-form" onSubmit={onSubmit} className="flex flex-col gap-3 px-4 py-3">
        <input type="hidden" name="causa_id" value={causa.id} />
        {state.error && <FormAlert state={state} />}

        <div>
          <label className="block text-[12px] font-semibold text-sub mb-1">Tipo</label>
          <select name="tipo_vencimiento"
            defaultValue={causa.tipo_vencimiento === "Alerta" ? "Recordatorio" : (causa.tipo_vencimiento ?? "Vencimiento")}
            className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text outline-none focus:border-blue">
            {TIPOS_VENC.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-sub mb-1">Fecha</label>
          <input name="proximo_vencimiento" type="date"
            defaultValue={causa.proximo_vencimiento ?? ""}
            className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text outline-none focus:border-blue" />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-sub mb-1">Motivo / descripción</label>
          <input name="motivo_vencimiento"
            defaultValue={causa.motivo_vencimiento ?? ""}
            placeholder="Presentación de escrito, audiencia de conciliación…"
            maxLength={200}
            className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue" />
        </div>
      </form>
    </Modal>
  );
}
