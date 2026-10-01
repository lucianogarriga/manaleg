"use client";

import { addDiaInhabil } from "@/app/(app)/calendario/actions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, SelectField, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";

interface DiaInhabilFormProps {
  defaultDate: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function DiaInhabilForm({ defaultDate, onClose, onSaved }: DiaInhabilFormProps) {
  const { state, pending, onSubmit } = useFormAction(addDiaInhabil, (s) => onSaved(s.message ?? "Guardado."));

  return (
    <Modal
      open
      title="Agregar día inhábil"
      onClose={onClose}
      footer={<ModalFooter formId="inhabil-form" pending={pending} submitLabel="Guardar" onCancel={onClose} />}
    >
      <form id="inhabil-form" onSubmit={onSubmit}>
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}
        <FormSection title="Día o rango de días">
          <TextField label="Desde" name="desde" type="date" required defaultValue={defaultDate} autoFocus />
          <TextField label="Hasta (opcional)" name="hasta" type="date" />
          <SelectField label="Tipo" name="tipo" options={["Feria judicial", "Día inhábil"]} defaultValue="Día inhábil" />
          <TextField label="Descripción" name="descripcion" required placeholder="Feria judicial de invierno" />
        </FormSection>
        <p className="px-4 pb-3 text-[13px] text-muted">
          Los días que cargues acá cuentan como inhábiles en el calendario, en la calculadora de plazos y en los
          avisos por email. Solo los ves vos.
        </p>
      </form>
    </Modal>
  );
}
