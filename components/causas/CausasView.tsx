"use client";

import { Scale } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import FAB from "@/components/ui/FAB";
import { useCausas } from "@/hooks/useCausas";
import { useCausasStore } from "@/store/causasStore";
import type { ClienteOption } from "@/services/supabase/clientes";
import type { CausaConRelaciones } from "@/types";
import CausaDetail from "./CausaDetail";
import CausaForm from "./CausaForm";
import CausasList from "./CausasList";

interface CausasViewProps {
  causas: CausaConRelaciones[];
  clientes: ClienteOption[];
  userId: string;
}

// Vista master-detail: lista a la izquierda, detalle a la derecha.
// En mobile se muestra una u otra según haya una causa seleccionada.
export default function CausasView({ causas, clientes, userId }: CausasViewProps) {
  const { causas: visibles, total } = useCausas(causas, userId);
  const selectedId = useCausasStore((s) => s.selectedId);
  const formOpen = useCausasStore((s) => s.formOpen);
  const editingId = useCausasStore((s) => s.editingId);
  const openCreate = useCausasStore((s) => s.openCreate);

  // En desktop, si no hay selección (o ya no existe) se muestra la primera
  const selected = causas.find((c) => c.id === selectedId) ?? null;
  const shown = selected ?? visibles[0] ?? null;
  const editing = editingId ? (causas.find((c) => c.id === editingId) ?? null) : null;

  // Un único return con el formulario siempre en la misma posición del árbol:
  // si cambiara de lugar (p. ej. al pasar de 0 a 1 causa) React lo remontaría
  // y perdería el estado del guardado, dejando el modal abierto y vacío.
  return (
    <>
      {total === 0 ? (
        <EmptyState
          icon={Scale}
          title="Todavía no cargaste causas"
          description="Creá tu primera causa para empezar a seguir vencimientos, movimientos y honorarios."
        >
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[7px] text-[14px] font-semibold text-white hover:opacity-90"
          >
            + Nueva causa
          </button>
        </EmptyState>
      ) : (
        <div className="flex h-full overflow-hidden">
          <CausasList
            causas={visibles}
            total={total}
            activeId={shown?.id ?? null}
            className={`w-full md:w-[330px] md:shrink-0 ${selected ? "hidden md:flex" : "flex"}`}
          />
          {shown ? (
            <CausaDetail
              causa={shown}
              userId={userId}
              className={`flex-1 ${selected ? "block" : "hidden md:block"}`}
            />
          ) : (
            <div className="hidden flex-1 items-center justify-center text-[13.5px] text-muted md:flex">
              Seleccioná una causa para ver el detalle
            </div>
          )}
        </div>
      )}
      {total > 0 && <FAB onClick={openCreate} label="Nueva causa" />}
      {formOpen && (
        <CausaForm key={editingId ?? "new"} causa={editing} clientes={clientes} userId={userId} />
      )}
    </>
  );
}
