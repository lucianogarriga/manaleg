"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, User } from "lucide-react";
import { eliminarCliente } from "@/app/(app)/clientes/clienteActions";
import EmptyState from "@/components/ui/EmptyState";
import FAB from "@/components/ui/FAB";
import { useUIStore } from "@/store/uiStore";
import type { Cliente } from "@/types";
import ClienteForm from "./ClienteForm";

interface ClientesViewProps {
  clientes: Cliente[];
}

export default function ClientesView({ clientes }: ClientesViewProps) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: Cliente) => { setEditing(c); setFormOpen(true); };

  const handleDelete = async (c: Cliente) => {
    if (!confirm(`¿Eliminar a ${c.nombre_completo}? Esta acción no se puede deshacer.`)) return;
    const result = await eliminarCliente(c.id);
    showToast({ message: result.error ?? result.message ?? "Listo." });
    if (!result.error) router.refresh();
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
                <th className="hidden px-[14px] py-[9px] text-[11px] font-bold uppercase tracking-[.4px] text-muted sm:table-cell">DNI / CUIT</th>
                <th className="hidden px-[14px] py-[9px] text-[11px] font-bold uppercase tracking-[.4px] text-muted md:table-cell">Teléfono</th>
                <th className="hidden px-[14px] py-[9px] text-[11px] font-bold uppercase tracking-[.4px] text-muted lg:table-cell">Email</th>
                <th className="w-[80px] px-[14px] py-[9px]" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-b-0 bg-card transition-colors"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-card)"; }}
                >
                  <td className="px-[14px] py-[10px]">
                    <div className="text-[14px] font-semibold text-text">{c.nombre_completo}</div>
                    {c.notas && (
                      <div className="truncate text-[12px] text-muted">{c.notas}</div>
                    )}
                  </td>
                  <td className="hidden px-[14px] py-[10px] text-[13px] text-sub sm:table-cell">
                    {c.dni_cuit ?? "—"}
                  </td>
                  <td className="hidden px-[14px] py-[10px] text-[13px] text-sub md:table-cell">
                    {c.telefono ?? "—"}
                  </td>
                  <td className="hidden px-[14px] py-[10px] text-[13px] text-sub lg:table-cell">
                    {c.email ?? "—"}
                  </td>
                  <td className="px-[14px] py-[10px]">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        title="Editar cliente"
                        className="flex cursor-pointer rounded p-1 text-muted transition-colors hover:bg-blue-lt hover:text-blue"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        title="Eliminar cliente"
                        className="flex cursor-pointer rounded p-1 text-muted transition-colors hover:bg-red-lt hover:text-red"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FAB onClick={openCreate} label="Nuevo cliente" />

      {formOpen && (
        <ClienteForm
          cliente={editing}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
