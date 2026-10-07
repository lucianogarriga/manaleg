"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, Scale } from "lucide-react";
import { CAUSAS_LIMIT } from "@/services/supabase/causas";
import { normalizeTipoJuicio } from "@/utils/constants";
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
import FabSpotlight from "@/components/ui/FabSpotlight";

type ViewMode = "list" | "grid";

interface CausasViewProps {
  causas: CausaConRelaciones[];
  totalEnBD: number;
  clientes: ClienteOption[];
  userId: string;
  causasMax: number;
}

export default function CausasView({ causas, totalEnBD, clientes, userId, causasMax }: CausasViewProps) {
  const { causas: visibles, total, counts } = useCausas(causas, userId);
  // Solo causas propias cuentan para el límite (las compartidas no son del usuario)
  const causasPropias = causas.filter((c) => c.user_id === userId).length;
  // Tipos de juicio únicos presentes en la lista (para el dropdown de filtros)
  const tiposJuicio = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of causas) {
      if (c.tipo_juicio) {
        const canonical = normalizeTipoJuicio(c.tipo_juicio);
        const key = canonical.toLowerCase();
        if (!seen.has(key)) seen.set(key, canonical);
      }
    }
    return [...seen.values()].sort();
  }, [causas]);
  const atLimit = causasPropias >= causasMax;
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
            onClick={atLimit ? undefined : openCreate}
            disabled={atLimit}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[7px] text-[14px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Nueva causa
          </button>
        </EmptyState>
      ) : (
        <div className="flex flex-col">
          <StatsRow causas={causas} />

          {totalEnBD > CAUSAS_LIMIT && (
            <div className="mx-3 mb-1 mt-2 flex items-center gap-2 rounded-lg border border-amb/30 bg-amb/10 px-3 py-2 text-[12px] text-amb">
              <AlertTriangle size={13} className="shrink-0" />
              <span>
                Tenés <strong>{totalEnBD}</strong> causas pero solo se muestran las primeras <strong>{CAUSAS_LIMIT}</strong>.
                Los filtros y conteos pueden ser incompletos. Contactá al equipo para habilitar más.
              </span>
            </div>
          )}

          <FilterChips
            total={total}
            counts={counts}
            tiposJuicio={tiposJuicio}
            causasPropias={causasPropias}
            causasMax={causasMax}
            viewMode={viewMode}
            onViewChange={toggleView}
          />

          {/* Lista o grid */}
          {viewMode === "list" ? (
            <div className="py-1 pb-16">
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
            <div className="px-4 py-3 pb-16 sm:px-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
      <FabSpotlight />

      {total > 0 && (
        <FAB
          onClick={atLimit ? undefined : openCreate}
          label={atLimit ? `Límite alcanzado (${causasMax})` : "Nueva causa"}
          disabled={atLimit}
        />
      )}
      {formOpen && (
        <CausaForm key={editingId ?? "new"} causa={editing} clientes={clientes} userId={userId} />
      )}
    </>
  );
}
