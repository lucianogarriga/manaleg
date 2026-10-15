"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";

interface AnularFormProps {
  titulo: string;
  mensaje: string;
  onConfirm: (motivo: string) => Promise<string | null>; // devuelve el error, o null si salió bien
  onClose: () => void;
}

export default function AnularForm({ titulo, mensaje, onConfirm, onClose }: AnularFormProps) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(await onConfirm(motivo.trim()));
    setPending(false);
  };

  return (
    <Modal
      open
      title={titulo}
      onClose={onClose}
      footer={<ModalFooter formId="anular-form" pending={pending} submitLabel="Anular" onCancel={onClose} />}
    >
      <form id="anular-form" onSubmit={onSubmit} className="space-y-3 p-4">
        <p className="text-[13px] text-sub">{mensaje}</p>
        {error && <p className="text-[13px] text-red">{error}</p>}
        <textarea
          required
          rows={3}
          maxLength={500}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo de la anulación"
          className="w-full resize-none rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue focus:ring-1 focus:ring-blue"
        />
      </form>
    </Modal>
  );
}
