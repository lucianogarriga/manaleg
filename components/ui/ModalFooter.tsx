// Botones Cancelar / Guardar para el footer de los modales con formulario.
interface ModalFooterProps {
  formId: string;
  pending: boolean;
  submitLabel: string;
  pendingLabel?: string;
  onCancel: () => void;
}

export default function ModalFooter({
  formId,
  pending,
  submitLabel,
  pendingLabel = "Guardando…",
  onCancel,
}: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded-[6px] border border-border bg-card px-3 py-[6px] text-[14px] font-medium text-sub hover:bg-bg"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form={formId}
        disabled={pending}
        className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}
