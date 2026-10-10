"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import { deleteMovimiento } from "@/app/(app)/causas/detailActions";
import CardSection, { CardAction } from "@/components/ui/CardSection";
import { useMovimientos } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import MovimientoForm from "./MovimientoForm";
import MovimientoTimeline from "./MovimientoTimeline";
import type { MovimientoConAutor } from "@/types";

export interface MovimientosSectionRef {
  openForm: () => void;
}

const MovimientosSection = forwardRef<
  MovimientosSectionRef,
  { causaId: string; userId: string; naked?: boolean }
>(function MovimientosSection({ causaId, userId, naked = false }, ref) {
  const router = useRouter();
  const { data, loading, error, reload } = useMovimientos(causaId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MovimientoConAutor | undefined>(undefined);
  const showToast = useUIStore((s) => s.showToast);

  useImperativeHandle(ref, () => ({ openForm: () => setFormOpen(true) }), []);

  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();
  const afterChange = () => { reload(); router.refresh(); };

  const onDelete = async (id: string) => {
    const ok = await confirmRequest({ title: "Eliminar movimiento", message: "¿Eliminar este movimiento?", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    const result = await deleteMovimiento(id);
    if (result.error) return showToast({ message: result.error });
    showToast({ message: result.message ?? "Movimiento eliminado." });
    afterChange();
  };

  const onEdit = (m: MovimientoConAutor) => {
    setEditing(m);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditing(undefined);
  };

  const handleSaved = (msg: string) => {
    handleClose();
    showToast({ message: msg });
    afterChange();
  };

  const inner = loading ? (
    <div className="space-y-3 px-[13px] py-4" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[14px] animate-pulse rounded bg-border" style={{ width: `${90 - i * 18}%` }} />
      ))}
    </div>
  ) : error ? (
    <p className="px-[13px] py-4 text-[13px] text-red">No se pudo cargar el historial: {error}</p>
  ) : data.length === 0 ? (
    <p className="px-[13px] py-4 text-[13.5px] text-muted">Todavía no hay movimientos en esta causa.</p>
  ) : (
    <MovimientoTimeline items={data} userId={userId} onDelete={onDelete} onEdit={onEdit} />
  );

  return (
    <>
      {naked ? (
        <div>{inner}</div>
      ) : (
        <CardSection
          title="Historial de movimientos"
          action={<CardAction onClick={() => setFormOpen(true)}>+ Agregar</CardAction>}
        >
          {inner}
        </CardSection>
      )}

      {formOpen && (
        <MovimientoForm
          causaId={causaId}
          editing={editing}
          onClose={handleClose}
          onSaved={() => handleSaved(editing ? "Movimiento actualizado." : "Movimiento agregado.")}
        />
      )}
      {confirmDialog}
    </>
  );
});

export default MovimientosSection;
