"use client";

import { useState, useEffect } from "react";
import { Scale, LayoutList, LayoutGrid } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import FAB from "@/components/ui/FAB";
import FilterChips from "./FilterChips";
import StatsRow from "./StatsRow";
import { useCausas } from "@/hooks/useCausas";
import { useCausasStore } from "@/store/causasStore";
import type { ClienteOption } from "@/services/supabase/clientes";
import type { CausaConRelaciones } from "@/types";
import CausaForm from "./CausaForm";
import CausaModal from "./CausaModal";
import CausaRow from "./CausaRow";
import CausaCard from "./CausaCard";

type ViewMode = "list" | "grid";

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

  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("causas-view") as ViewMode | null;
      if (saved === "list" || saved === "grid") setViewMode(saved);
    } catch {}
  }, []);

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem("causas-view", mode); } catch {}
  };

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
      ) : (
        <div className="flex h-full flex-col overflow-hidden">
          <StatsRow causas={causas} />

          {/* FilterChips + toggle de vista */}
          <div className="flex items-center gap-2 pr-3">
            <div className="flex-1">
              <FilterChips total={total} />
            </div>
            <div
              className="flex shrink-0 items-center gap-[2px] rounded-[7px] p-[3px]"
              style={{ background: "var(--color-border)" }}
            >
              <button
                type="button"
                title="Vista lista"
                onClick={() => toggleView("list")}
                className="flex cursor-pointer items-center justify-center rounded-[5px] p-[5px] transition-colors"
                style={{
                  background: viewMode === "list" ? "var(--color-card)" : "transparent",
                  color: viewMode === "list" ? "var(--color-blue)" : "var(--color-muted)",
                  boxShadow: viewMode === "list" ? "0 1px 2px rgba(0,0,0,.1)" : undefined,
                }}
              >
                <LayoutList size={14} />
              </button>
              <button
                type="button"
                title="Vista tarjetas"
                onClick={() => toggleView("grid")}
                className="flex cursor-pointer items-center justify-center rounded-[5px] p-[5px] transition-colors"
                style={{
                  background: viewMode === "grid" ? "var(--color-card)" : "transparent",
                  color: viewMode === "grid" ? "var(--color-blue)" : "var(--color-muted)",
                  boxShadow: viewMode === "grid" ? "0 1px 2px rgba(0,0,0,.1)" : undefined,
                }}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          {/* Lista o grid */}
          {viewMode === "list" ? (
            <div className="flex-1 overflow-y-auto py-1 pb-16">
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
          ) : (
            <div className="flex-1 overflow-y-auto p-3 pb-16">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibles.map((causa) => (
                  <CausaCard
                    key={causa.id}
                    causa={causa}
                    active={selectedId === causa.id}
                    onSelect={() => select(causa.id)}
                  />
                ))}
              </div>
              {visibles.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px] text-muted">
                  {search ? `No hay causas que coincidan con "${search}".` : "No hay causas en este filtro."}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {selected && <CausaModal causa={selected} userId={userId} />}

      {total > 0 && <FAB onClick={openCreate} label="Nueva causa" />}
      {formOpen && (
        <CausaForm key={editingId ?? "new"} causa={editing} clientes={clientes} userId={userId} />
      )}
    </>
  );
}
