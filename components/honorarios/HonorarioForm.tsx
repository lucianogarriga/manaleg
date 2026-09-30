"use client";

import { saveHonorario } from "@/app/(app)/causas/detailActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";
import type { Honorario } from "@/types";

interface HonorarioFormProps {
  causaId: string;
  honorario: Honorario | null; // null = definir por primera vez
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function HonorarioForm({ causaId, honorario, onClose, onSaved }: HonorarioFormProps) {
  const { state, pending, onSubmit } = useFormAction(saveHonorario, (s) => onSaved(s.message ?? "Guardado."));

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
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}
        <FormSection title="Acuerdo de honorarios">
          <TextField
            label="Monto acordado ($)"
            name="monto_acordado"
            inputMode="decimal"
            required
            autoFocus
            defaultValue={honorario?.monto_acordado ?? ""}
            placeholder="840000"
          />
          <TextField
            label="Porcentaje (%)"
            name="porcentaje"
            inputMode="decimal"
            defaultValue={honorario?.porcentaje ?? ""}
            placeholder="Opcional"
          />
          <TextField label="Fecha del pacto" name="fecha_pacto" type="date" defaultValue={honorario?.fecha_pacto ?? ""} />
        </FormSection>
      </form>
    </Modal>
  );
}
