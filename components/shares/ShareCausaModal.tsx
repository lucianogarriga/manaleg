"use client";

import { shareCausa } from "@/app/(app)/causas/shareActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";

interface ShareCausaModalProps {
  causaId: string;
  caratula: string;
  onClose: () => void;
  onShared: (message: string) => void;
}

export default function ShareCausaModal({ causaId, caratula, onClose, onShared }: ShareCausaModalProps) {
  const { state, pending, onSubmit } = useFormAction(shareCausa, (s) => onShared(s.message ?? "Compartida."));

  return (
    <Modal
      open
      title="Compartir causa"
      onClose={onClose}
      footer={<ModalFooter formId="share-form" pending={pending} submitLabel="Compartir" pendingLabel="Compartiendo…" onCancel={onClose} />}
    >
      <form id="share-form" onSubmit={onSubmit}>
        <input type="hidden" name="causa_id" value={causaId} />
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}
        <FormSection title={caratula}>
          <div className="sm:col-span-2">
            <TextField
              label="Email del colega"
              name="email"
              type="email"
              required
              autoFocus
              placeholder="colega@estudio.com"
            />
          </div>
        </FormSection>
        <p className="px-4 pb-3 text-[13px] text-muted">
          El colega tiene que estar registrado en MANALEG. Va a poder ver y editar la causa, sus movimientos,
          vencimientos y honorarios. Solo vos podés eliminarla o quitarle el acceso.
        </p>
      </form>
    </Modal>
  );
}
