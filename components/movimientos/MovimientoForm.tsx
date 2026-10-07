"use client";

import { createMovimiento } from "@/app/(app)/causas/detailActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, SelectField, TextAreaField, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";
import { TIPOS_MOVIMIENTO } from "@/utils/constants";
import { todayISO } from "@/utils/formatters";

interface MovimientoFormProps {
  causaId: string;
  onClose: () => void;
  onSaved: () => void;
}

// Se monta solo mientras el modal está abierto (estado limpio en cada apertura)
export default function MovimientoForm({ causaId, onClose, onSaved }: MovimientoFormProps) {
  const { state, pending, onSubmit } = useFormAction(createMovimiento, onSaved);

  return (
    <Modal
      open
      title="Nuevo movimiento"
      onClose={onClose}
      footer={<ModalFooter formId="movimiento-form" pending={pending} submitLabel="Agregar" onCancel={onClose} />}
    >
      <form id="movimiento-form" onSubmit={onSubmit}>
        <input type="hidden" name="causa_id" value={causaId} />
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}
        <FormSection title="Movimiento">
          <SelectField label="Tipo" name="tipo" options={TIPOS_MOVIMIENTO} defaultValue="Presentación" />
          <TextField label="Fecha" name="fecha" type="date" defaultValue={todayISO()} max={todayISO()} />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Descripción"
              name="descripcion"
              required
              autoFocus
              placeholder="Presentado escrito de ofrecimiento de prueba…"
            />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
