"use client";

import { Scale } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import FAB from "@/components/ui/FAB";
import FilterChips from "./FilterChips";
import StatsRow from "./StatsRow";
import { useCausas } from "@/hooks/useCausas";
import { useCausasStore } from "@/store/causasStore";
import type { ClienteOption } from "@/services/supabase/clientes";
import type { CausaConRelaciones } from "@/types";
import CausaDetail from "./CausaDetail";
import CausaForm from "./CausaForm";
import CausasList from "./CausasList";
import CausaRow from "./CausaRow";

interface CausasViewProps {
  causas: CausaConRelaciones[];
  clientes: ClienteOption[];
  userId: string;
}

export default function CausasView({ causas, clientes, userId }: CausasViewProps) {
  const { causas: visibles, total } = useCausas(causas, userId);
  const selectedId = useCausasStore((s) => s.selectedId);
  const formOpen = useCausasStore((s) => s.formOpen);
  const editingId = useCausasStore((s) => s.editingId);
  const openCreate = useCausasStore((s) => s.openCreate);
  const select = useCausasStore((s) => s.select);
  const search = useCausasStore((s) => s.search);

  const selected = causas.find((c) => c.id === selectedId) ?? null;
  const editing = editingId ? (causas.find((c) => c.id === editingId) ?? null) : null;

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
      ) : selected ? (
        // ── Modo detalle: lista estrecha + panel de detalle ──
        <div className="flex h-full overflow-hidden">
          <CausasList
            causas={visibles}
            total={total}
            activeId={selected.id}
            className={`w-full md:w-[310px] md:shrink-0 hidden md:flex`}
          />
          <CausaDetail
            causa={selected}
            userId={userId}
            className="flex-1"
          />
        </div>
      ) : (
        // ── Modo dashboard: stats + lista wide ──
        <div className="flex h-full flex-col overflow-hidden">
          <StatsRow causas={causas} />
          <FilterChips total={total} />
          <div className="flex-1 overflow-y-auto bg-card">
            {visibles.map((causa) => (
              <CausaRow
                key={causa.id}
                causa={causa}
                active={false}
                onSelect={() => select(causa.id)}
                wide
              />
            ))}
            {visibles.length === 0 && (
              <p className="px-4 py-8 text-center text-[13px] text-muted">
                {search ? `No hay causas que coincidan con "${search}".` : "No hay causas en este filtro."}
              </p>
            )}
          </div>
        </div>
      )}

      {total > 0 && <FAB onClick={openCreate} label="Nueva causa" />}
      {formOpen && (
        <CausaForm key={editingId ?? "new"} causa={editing} clientes={clientes} userId={userId} />
      )}
    </>
  );
}
