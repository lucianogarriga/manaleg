"use client";

import { useCausasStore, type CausasFilter } from "@/store/causasStore";

const CHIPS: { value: CausasFilter; label: string; urgent?: boolean; color?: string }[] = [
  { value: "todas",        label: "Todas" },
  { value: "mias",         label: "Mis causas" },
  { value: "compartidas",  label: "Compartidas" },
  { value: "urgentes",     label: "Urgentes", urgent: true },
  { value: "recordatorios",label: "Recordatorios", color: "blue" },
  { value: "cerradas",     label: "Cerradas" },
];

const FUEROS = [
  { key: "JUD", label: "Judicial" },
  { key: "EXT", label: "Extrajudicial" },
  { key: "ADM", label: "Administrativo" },
  { key: "MED", label: "Mediación" },
  { key: "DEF", label: "Cons." },
];

interface FilterChipsProps {
  total: number;
  counts?: Partial<Record<CausasFilter, number>>;
  tiposJuicio?: string[];
}

export default function FilterChips({ total, counts = {}, tiposJuicio = [] }: FilterChipsProps) {
  const filter     = useCausasStore((s) => s.filter);
  const setFilter  = useCausasStore((s) => s.setFilter);
  const fueros     = useCausasStore((s) => s.fueros);
  const toggleFuero = useCausasStore((s) => s.toggleFuero);
  const tipoJuicio = useCausasStore((s) => s.tipoJuicio);
  const setTipoJuicio = useCausasStore((s) => s.setTipoJuicio);
  const clearAdvancedFilters = useCausasStore((s) => s.clearAdvancedFilters);

  const hasAdvanced = fueros.size > 0 || tipoJuicio !== null;

  return (
    <div className="flex flex-col border-b border-border">
      {/* Fila 1: chips principales */}
      <div className="flex flex-wrap gap-[5px] px-3 pt-2 pb-[6px]">
        {CHIPS.map((chip) => {
          const on = filter === chip.value;
          const count = chip.value === "todas" ? total : (counts[chip.value] ?? 0);
          const style = on
            ? "border-blue bg-blue text-white"
            : chip.urgent
              ? "border-red-bd text-red hover:bg-red-lt"
              : chip.color === "blue"
                ? "border-blue/30 text-blue hover:bg-blue-lt"
                : "border-border text-sub hover:bg-bg";
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilter(chip.value)}
              className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-[20px] border px-2 py-[3px] text-[12px] font-medium ${style}`}
            >
              {chip.urgent && <span className={`h-[6px] w-[6px] rounded-full ${on ? "bg-white" : "bg-red"}`} />}
              {chip.label}
              {count > 0 && <span className={`text-[11px] ${on ? "opacity-80" : "opacity-60"}`}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Fila 2: filtros avanzados */}
      <div className="flex flex-wrap items-center gap-[5px] px-3 pb-2">
        {/* Fuero chips */}
        {FUEROS.map((f) => {
          const on = fueros.has(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleFuero(f.key)}
              className={`inline-flex cursor-pointer items-center whitespace-nowrap rounded-[4px] border px-[7px] py-[2px] text-[11px] font-bold transition-colors ${
                on
                  ? "border-blue/60 bg-blue/10 text-blue"
                  : "border-border text-muted hover:border-blue/30 hover:text-sub"
              }`}
            >
              {f.key}
            </button>
          );
        })}

        {/* Separador visual */}
        {tiposJuicio.length > 0 && (
          <span className="h-[14px] w-px bg-border mx-[2px]" />
        )}

        {/* Dropdown tipo de causa */}
        {tiposJuicio.length > 0 && (
          <select
            value={tipoJuicio ?? ""}
            onChange={(e) => setTipoJuicio(e.target.value || null)}
            className="cursor-pointer rounded-[4px] border px-[6px] py-[2px] text-[11px] font-medium outline-none transition-colors"
            style={{
              borderColor: tipoJuicio ? "var(--color-blue)" : "var(--color-border)",
              color: tipoJuicio ? "var(--color-blue)" : "var(--color-muted)",
              background: tipoJuicio ? "var(--color-blue-lt)" : "var(--color-card)",
            }}
          >
            <option value="">Tipo de causa</option>
            {tiposJuicio.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {/* Limpiar filtros */}
        {hasAdvanced && (
          <button
            type="button"
            onClick={clearAdvancedFilters}
            className="ml-auto inline-flex cursor-pointer items-center gap-[4px] rounded-[4px] border border-border px-[7px] py-[2px] text-[11px] text-muted transition-colors hover:border-red-bd hover:text-red"
          >
            <span className="text-[10px]">✕</span>
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
