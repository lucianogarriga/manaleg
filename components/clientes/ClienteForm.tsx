"use client";

import { saveCliente } from "@/app/(app)/clientes/clienteActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, TextAreaField, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";
import type { Cliente } from "@/types";

interface ClienteFormProps {
  cliente?: Cliente | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClienteForm({ cliente, onClose, onSaved }: ClienteFormProps) {
  const { state, pending, onSubmit } = useFormAction(saveCliente, onSaved);
  const v = state.values ?? {};

  return (
    <Modal
      open
      title={cliente ? "Editar cliente" : "Nuevo cliente"}
      onClose={onClose}
      footer={
        <ModalFooter
          formId="cliente-form"
          pending={pending}
          submitLabel={cliente ? "Guardar cambios" : "Crear cliente"}
          onCancel={onClose}
        />
      }
    >
      <form id="cliente-form" onSubmit={onSubmit}>
        {cliente && <input type="hidden" name="id" value={cliente.id} />}
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}
        <FormSection title="Datos del cliente">
          <div className="sm:col-span-2">
            <TextField
              label="Nombre completo"
              name="nombre_completo"
              required
              autoFocus
              defaultValue={v.nombre_completo ?? cliente?.nombre_completo ?? ""}
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <TextField
            label="DNI / CUIT"
            name="dni_cuit"
            defaultValue={v.dni_cuit ?? cliente?.dni_cuit ?? ""}
            placeholder="20-12345678-3"
          />
          <TextField
            label="Teléfono"
            name="telefono"
            type="tel"
            defaultValue={v.telefono ?? cliente?.telefono ?? ""}
            placeholder="+54 11 1234-5678"
          />
          <div className="sm:col-span-2">
            <TextField
              label="Email"
              name="email"
              type="email"
              defaultValue={v.email ?? cliente?.email ?? ""}
              placeholder="cliente@email.com"
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              label="Notas"
              name="notas"
              defaultValue={v.notas ?? cliente?.notas ?? ""}
              placeholder="Observaciones adicionales…"
            />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
