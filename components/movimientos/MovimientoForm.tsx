"use client";

import { createMovimiento, updateMovimiento } from "@/app/(app)/causas/detailActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, SelectField, TextAreaField, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";
import { TIPOS_MOVIMIENTO } from "@/utils/constants";
import { todayISO } from "@/utils/formatters";
import type { MovimientoConAutor } from "@/types";

interface MovimientoFormProps {
  causaId: string;
  editing?: MovimientoConAutor;
  onClose: () => void;
  onSaved: () => void;
}

export default function MovimientoForm({ causaId, editing, onClose, onSaved }: MovimientoFormProps) {
  const action = editing ? updateMovimiento : createMovimiento;
  const { state, pending, onSubmit } = useFormAction(action, onSaved);

  const fechaDefault = editing
    ? editing.fecha.slice(0, 10)
    : todayISO();

  return (
    <Modal
      open
      title={editing ? "Editar movimiento" : "Nuevo movimiento"}
      onClose={onClose}
      footer={
        <ModalFooter
          formId="movimiento-form"
          pending={pending}
          submitLabel={editing ? "Guardar cambios" : "Agregar"}
          onCancel={onClose}
        />
      }
    >
      <form id="movimiento-form" onSubmit={onSubmit}>
        <input type="hidden" name="causa_id" value={causaId} />
        {editing && <input type="hidden" name="id" value={editing.id} />}
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}
        <FormSection title="Movimiento">
          <SelectField
            label="Tipo"
            name="tipo"
            options={TIPOS_MOVIMIENTO}
            defaultValue={editing?.tipo ?? "Presentación"}
          />
          <TextField
            label="Fecha"
            name="fecha"
            type="date"
            defaultValue={fechaDefault}
            max={todayISO()}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Descripción"
              name="descripcion"
              required
              autoFocus
              placeholder="Presentado escrito de ofrecimiento de prueba…"
              defaultValue={editing?.descripcion}
            />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
