"use client";

import { createPago } from "@/app/(app)/causas/detailActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";
import { formatCurrency, todayISO } from "@/utils/formatters";

interface PagoFormProps {
  causaId: string;
  honorarioId: string;
  saldo: number; // ayuda visual: cuánto falta cobrar
  onClose: () => void;
  onSaved: () => void;
}

export default function PagoForm({ causaId, honorarioId, saldo, onClose, onSaved }: PagoFormProps) {
  const { state, pending, onSubmit } = useFormAction(createPago, onSaved);

  return (
    <Modal
      open
      title="Registrar pago"
      onClose={onClose}
      footer={<ModalFooter formId="pago-form" pending={pending} submitLabel="Registrar pago" onCancel={onClose} />}
    >
      <form id="pago-form" onSubmit={onSubmit}>
        <input type="hidden" name="causa_id" value={causaId} />
        <input type="hidden" name="honorario_id" value={honorarioId} />
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}
        <FormSection title={`Saldo pendiente: ${formatCurrency(saldo)}`}>
          <TextField label="Monto ($)" name="monto" inputMode="decimal" required autoFocus placeholder="140000" />
          <TextField label="Fecha de pago" name="fecha_pago" type="date" defaultValue={todayISO()} max={todayISO()} />
          <div className="sm:col-span-2">
            <TextField label="Descripción" name="descripcion" placeholder="Pago parcial n° 2" />
          </div>
          <div className="sm:col-span-2">
            <TextField label="Link comprobante (Drive)" name="comprobante_drive" type="url" placeholder="https://drive.google.com/…" />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
