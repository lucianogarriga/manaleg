"use client";

import { useCausasStore } from "@/store/causasStore";
import type { CausaConRelaciones } from "@/types";
import CausaRow from "./CausaRow";
import FilterChips from "./FilterChips";

interface CausasListProps {
  causas: CausaConRelaciones[];
  total: number;
  activeId: string | null;
  className?: string;
}

export default function CausasList({ causas, total, activeId, className = "" }: CausasListProps) {
  const select = useCausasStore((s) => s.select);
  const search = useCausasStore((s) => s.search);

  return (
    <div className={`flex flex-col overflow-hidden border-r border-border bg-card ${className}`}>
      <FilterChips total={total} />
      <div className="flex-1 overflow-y-auto">
        {causas.map((causa) => (
          <CausaRow
            key={causa.id}
            causa={causa}
            active={causa.id === activeId}
            onSelect={() => select(causa.id)}
          />
        ))}
        {causas.length === 0 && (
          <p className="px-4 py-8 text-center text-[13px] text-muted">
            {search ? `No hay causas que coincidan con "${search}".` : "No hay causas en este filtro."}
          </p>
        )}
      </div>
    </div>
  );
}
