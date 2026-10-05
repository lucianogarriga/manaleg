"use client";

import { useState } from "react";
import { saveHonorario } from "@/app/(app)/causas/detailActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";
import type { Honorario } from "@/types";

interface HonorarioFormProps {
  causaId: string;
  honorario: Honorario | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function HonorarioForm({ causaId, honorario, onClose, onSaved }: HonorarioFormProps) {
  const { state, pending, onSubmit } = useFormAction(saveHonorario, (s) => onSaved(s.message ?? "Guardado."));
  const [moneda, setMoneda] = useState<"ARS" | "USD">(honorario?.moneda ?? "ARS");
  const [consultaCobrada, setConsultaCobrada] = useState(honorario?.consulta_cobrada ?? false);

  return (
    <Modal
      open
      title={honorario ? "Editar honorarios" : "Definir honorarios"}
      onClose={onClose}
      footer={<ModalFooter formId="honorario-form" pending={pending} submitLabel="Guardar" onCancel={onClose} />}
    >
      <form id="honorario-form" onSubmit={onSubmit}>
        <input type="hidden" name="causa_id" value={causaId} />
        {honorario && <input type="hidden" name="id" value={honorario.id} />}
        <input type="hidden" name="moneda" value={moneda} />
        <input type="hidden" name="consulta_cobrada" value={String(consultaCobrada)} />
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}

        <FormSection title="Acuerdo de honorarios">
          {/* Moneda selector */}
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-sub">Moneda</label>
            <div className="flex gap-2">
              {(["ARS", "USD"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMoneda(m)}
                  className={`rounded-[6px] border px-4 py-[6px] text-[13px] font-semibold transition-colors ${
                    moneda === m
                      ? "border-blue bg-blue text-white"
                      : "border-border bg-bg text-sub hover:border-blue"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <TextField
            label={`Monto acordado (${moneda})`}
            name="monto_acordado"
            inputMode="decimal"
            required
            autoFocus
            defaultValue={honorario?.monto_acordado ?? ""}
            placeholder={moneda === "USD" ? "5000" : "840000"}
          />
          <TextField
            label="Porcentaje (%)"
            name="porcentaje"
            inputMode="decimal"
            defaultValue={honorario?.porcentaje ?? ""}
            placeholder="Opcional"
          />
          <TextField
            label={`Monto adicional fijo (${moneda})`}
            name="monto_adicional"
            inputMode="decimal"
            defaultValue={honorario?.monto_adicional ?? ""}
            placeholder="Opcional"
          />
          <TextField label="Fecha del pacto" name="fecha_pacto" type="date" defaultValue={honorario?.fecha_pacto ?? ""} />
        </FormSection>

        <FormSection title="Consulta previa">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-sub">¿Se cobró consulta?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConsultaCobrada(true)}
                className={`rounded-[6px] border px-4 py-[6px] text-[13px] font-semibold transition-colors ${
                  consultaCobrada
                    ? "border-blue bg-blue text-white"
                    : "border-border bg-bg text-sub hover:border-blue"
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setConsultaCobrada(false)}
                className={`rounded-[6px] border px-4 py-[6px] text-[13px] font-semibold transition-colors ${
                  !consultaCobrada
                    ? "border-blue bg-blue text-white"
                    : "border-border bg-bg text-sub hover:border-blue"
                }`}
              >
                No
              </button>
            </div>
          </div>
          {consultaCobrada && (
            <TextField
              label={`Monto consulta (${moneda})`}
              name="monto_consulta"
              inputMode="decimal"
              defaultValue={honorario?.monto_consulta ?? ""}
              placeholder={moneda === "USD" ? "150" : "30000"}
            />
          )}
        </FormSection>

        <FormSection title="Notas / condiciones">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-sub">Notas sobre cuotas o condiciones</label>
            <textarea
              name="notas_honorarios"
              rows={3}
              maxLength={1000}
              defaultValue={honorario?.notas_honorarios ?? ""}
              placeholder="Ej: 3 cuotas iguales, la primera al inicio del juicio…"
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue focus:ring-1 focus:ring-blue resize-none"
            />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
