"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, User, X } from "lucide-react";
import { eliminarCliente } from "@/app/(app)/clientes/clienteActions";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import FAB from "@/components/ui/FAB";
import { useUIStore } from "@/store/uiStore";
import type { Cliente } from "@/types";
import ClienteForm from "./ClienteForm";

interface ClientesViewProps {
  clientes: Cliente[];
}

function ClienteDetailModal({
  cliente,
  onClose,
  onEdit,
  onDelete,
}: {
  cliente: Cliente;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-[17px] font-bold text-text">{cliente.nombre_completo}</h2>
              {cliente.dni_cuit && (
                <p className="mt-[2px] font-mono text-[12px] text-muted">{cliente.dni_cuit}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-3 mt-[2px] cursor-pointer rounded-lg p-[5px] text-sub transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Datos */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4">
            {[
              { label: "Teléfono", value: cliente.telefono },
              { label: "Email", value: cliente.email },
              { label: "DNI / CUIT", value: cliente.dni_cuit },
            ].map(({ label, value }) => value && (
              <div key={label}>
                <div className="mb-[2px] text-[10px] font-bold uppercase tracking-[.4px] text-muted">{label}</div>
                <div className="text-[13.5px] text-text">{value}</div>
              </div>
            ))}
            {cliente.notas && (
              <div className="col-span-2">
                <div className="mb-[2px] text-[10px] font-bold uppercase tracking-[.4px] text-muted">Notas</div>
                <div className="whitespace-pre-line text-[13.5px] text-text">{cliente.notas}</div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={onDelete}
              className="flex cursor-pointer items-center gap-[6px] rounded-[6px] border border-border px-3 py-[6px] text-[13px] font-medium text-red hover:bg-red-lt"
            >
              <Trash2 size={13} /> Eliminar
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="flex cursor-pointer items-center gap-[6px] rounded-[6px] bg-blue px-3 py-[6px] text-[13px] font-semibold text-white hover:opacity-90"
            >
              <Pencil size={13} /> Editar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ClientesView({ clientes }: ClientesViewProps) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [detail, setDetail] = useState<Cliente | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: Cliente) => { setDetail(null); setEditing(c); setFormOpen(true); };

  const handleDelete = async (c: Cliente) => {
    const ok = await confirmRequest({ title: "Eliminar cliente", message: `¿Eliminar a ${c.nombre_completo}? Esta acción no se puede deshacer.`, confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    const result = await eliminarCliente(c.id);
    showToast({ message: result.error ?? result.message ?? "Listo." });
    if (!result.error) { setDetail(null); router.refresh(); }
  };

  const handleSaved = () => {
    setFormOpen(false);
    showToast({ message: editing ? "Cliente actualizado." : "Cliente creado." });
    router.refresh();
  };

  if (clientes.length === 0) {
    return (
      <>
        <EmptyState
          icon={User}
          title="Todavía no cargaste clientes"
          description="Agregá clientes para poder asignarlos a tus causas."
        >
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[7px] text-[14px] font-semibold text-white hover:opacity-90"
          >
            + Nuevo cliente
          </button>
        </EmptyState>
        {formOpen && (
          <ClienteForm cliente={null} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
        )}
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <div className="overflow-y-auto px-4 py-4 pb-20 md:px-6 md:pb-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text">
            {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
          </h2>
        </div>

        <div className="overflow-hidden rounded-[8px] border border-border bg-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-[14px] py-[9px] text-[11px] font-bold uppercase tracking-[.4px] text-muted">Nombre</th>
                <th className="px-[14px] py-[9px] text-[11px] font-bold uppercase tracking-[.4px] text-muted">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setDetail(c)}
                  className="cursor-pointer border-b border-border last:border-b-0 transition-colors"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <td className="px-[14px] py-[10px]">
                    <div className="text-[14px] font-semibold text-text">{c.nombre_completo}</div>
                    {c.email && <div className="text-[11.5px] text-muted">{c.email}</div>}
                  </td>
                  <td className="px-[14px] py-[10px] text-[13px] text-sub">
                    {c.telefono ?? <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FAB onClick={openCreate} label="Nuevo cliente" />

      {detail && (
        <ClienteDetailModal
          cliente={detail}
          onClose={() => setDetail(null)}
          onEdit={() => openEdit(detail)}
          onDelete={() => handleDelete(detail)}
        />
      )}

      {formOpen && (
        <ClienteForm
          cliente={editing}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
      {confirmDialog}
    </>
  );
}
