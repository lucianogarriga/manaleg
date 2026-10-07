"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutGrid, LayoutList, X } from "lucide-react";
import { useCausasStore, type CausasFilter } from "@/store/causasStore";

const MAIN_CHIPS: { value: CausasFilter; label: string }[] = [
  { value: "todas",       label: "Todas" },
  { value: "mias",        label: "Mis causas" },
  { value: "compartidas", label: "Compartidas" },
];

const ESTADO_OPTS: { value: CausasFilter; label: string; dot: string }[] = [
  { value: "urgentes",      label: "Urgentes",      dot: "bg-red" },
  { value: "recordatorios", label: "Recordatorios", dot: "bg-blue" },
  { value: "cerradas",      label: "Cerradas",      dot: "bg-muted" },
];

const INSTANCIAS = [
  { key: "JUD", label: "Judicial" },
  { key: "EXT", label: "Extrajudicial" },
  { key: "ADM", label: "Administrativo" },
  { key: "MED", label: "Mediación" },
  { key: "DEF", label: "Consultoría" },
];

interface FilterChipsProps {
  total: number;
  counts?: Partial<Record<CausasFilter, number>>;
  tiposJuicio?: string[];
  causasPropias?: number;
  causasMax?: number;
  viewMode?: "list" | "grid";
  onViewChange?: (mode: "list" | "grid") => void;
}

export default function FilterChips({
  total,
  counts = {},
  tiposJuicio = [],
  causasPropias = 0,
  causasMax = 10,
  viewMode = "list",
  onViewChange,
}: FilterChipsProps) {
  const filter             = useCausasStore((s) => s.filter);
  const setFilter          = useCausasStore((s) => s.setFilter);
  const fueros             = useCausasStore((s) => s.fueros);
  const toggleFuero        = useCausasStore((s) => s.toggleFuero);
  const tipoJuicio         = useCausasStore((s) => s.tipoJuicio);
  const setTipoJuicio      = useCausasStore((s) => s.setTipoJuicio);
  const clearAdvancedFilters = useCausasStore((s) => s.clearAdvancedFilters);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const estadoActive  = (["urgentes", "recordatorios", "cerradas"] as CausasFilter[]).includes(filter);
  const activeCount   = fueros.size + (tipoJuicio ? 1 : 0) + (estadoActive ? 1 : 0);
  const hasAny        = activeCount > 0;
  const atLimit       = causasPropias >= causasMax;

  const clearAll = () => {
    clearAdvancedFilters();
    if (estadoActive) setFilter("todas");
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-[5px] border-b border-border px-3 py-[7px]">

      {/* ── Chips principales: scrollables en mobile ── */}
      <div
        className="flex min-w-0 flex-1 items-center gap-[5px] overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {MAIN_CHIPS.map((chip) => {
          const on    = filter === chip.value;
          const count = chip.value === "todas" ? total : (counts[chip.value] ?? 0);
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilter(chip.value)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-[20px] border px-[9px] py-[3px] text-[12px] font-medium transition-colors ${
                on ? "border-blue bg-blue text-white" : "border-border text-sub hover:bg-bg"
              }`}
            >
              {chip.label}
              {count > 0 && (
                <span className={`text-[11px] ${on ? "opacity-80" : "opacity-50"}`}>({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Separador ── */}
      <span className="h-[14px] w-px shrink-0 bg-border" />

      {/* ── Filtrar por: siempre visible, fuera del área scrollable ── */}
      <div ref={dropdownRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[20px] border px-[9px] py-[3px] text-[12px] font-medium transition-colors ${
            hasAny
              ? "border-blue/50 bg-blue/10 text-blue"
              : open
                ? "border-blue/40 text-blue"
                : "border-border text-sub hover:bg-bg"
          }`}
        >
          Filtrar
          {activeCount > 0 && (
            <span className="flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-blue px-[3px] text-[9px] font-bold leading-none text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={11}
            className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[240px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">

            {/* Estado */}
            <div className="px-3 pt-3 pb-2">
              <p className="mb-[6px] text-[10px] font-bold uppercase tracking-[.5px] text-muted">Estado</p>
              {ESTADO_OPTS.map((opt) => {
                const on = filter === opt.value;
                const cnt = counts[opt.value];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setFilter(on ? "todas" : opt.value); setOpen(false); }}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2 py-[5px] text-[13px] transition-colors ${
                      on ? "bg-blue/10 font-semibold text-blue" : "text-text hover:bg-bg"
                    }`}
                  >
                    <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${opt.dot}`} />
                    {opt.label}
                    {cnt != null && cnt > 0 && (
                      <span className="ml-auto text-[11px] text-muted">({cnt})</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-border" />

            {/* Instancia */}
            <div className="px-3 pt-3 pb-2">
              <p className="mb-[6px] text-[10px] font-bold uppercase tracking-[.5px] text-muted">Instancia</p>
              <div className="flex flex-wrap gap-[5px]">
                {INSTANCIAS.map((inst) => {
                  const on = fueros.has(inst.key);
                  return (
                    <button
                      key={inst.key}
                      type="button"
                      onClick={() => toggleFuero(inst.key)}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-[6px] border px-[8px] py-[4px] text-[11.5px] font-medium transition-colors ${
                        on
                          ? "border-blue/50 bg-blue/10 text-blue"
                          : "border-border text-sub hover:border-blue/30 hover:text-text"
                      }`}
                    >
                      {on && <span className="h-[5px] w-[5px] rounded-full bg-blue" />}
                      {inst.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipo de causa */}
            {tiposJuicio.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="px-3 pt-3 pb-2">
                  <p className="mb-[6px] text-[10px] font-bold uppercase tracking-[.5px] text-muted">Tipo de causa</p>
                  <div className="flex max-h-[140px] flex-col gap-[2px] overflow-y-auto">
                    {tiposJuicio.map((t) => {
                      const on = tipoJuicio === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipoJuicio(on ? null : t)}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2 py-[4px] text-left text-[12.5px] transition-colors ${
                            on ? "bg-blue/10 font-semibold text-blue" : "text-text hover:bg-bg"
                          }`}
                        >
                          <span
                            className={`h-[6px] w-[6px] shrink-0 rounded-full border transition-colors ${
                              on ? "border-blue bg-blue" : "border-border"
                            }`}
                          />
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Limpiar */}
            {hasAny && (
              <>
                <div className="h-px bg-border" />
                <div className="px-3 py-2">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-[6px] border border-border px-3 py-[5px] text-[12px] text-muted transition-colors hover:border-red-bd hover:text-red"
                  >
                    <X size={11} /> Limpiar filtros
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* X rápido cuando hay filtros activos */}
      {hasAny && (
        <button
          type="button"
          onClick={clearAll}
          title="Limpiar filtros"
          className="inline-flex shrink-0 cursor-pointer items-center rounded-full border border-border p-[3px] text-muted transition-colors hover:border-red-bd hover:text-red"
        >
          <X size={10} />
        </button>
      )}

      {/* ── Derecha: contador + toggle de vista ── */}
      <div className="flex shrink-0 items-center gap-2 pl-1">
        {/* Contador: solo desde sm */}
        <div className="hidden flex-col items-end gap-[2px] sm:flex">
          <span
            className="text-[11px] tabular-nums whitespace-nowrap leading-none"
            style={{ color: atLimit ? "#dc2626" : "var(--color-muted)" }}
          >
            {causasPropias}/{causasMax}
          </span>
          <div
            className="h-[2px] w-[40px] overflow-hidden rounded-full"
            style={{ background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (causasPropias / causasMax) * 100)}%`,
                background: atLimit ? "#dc2626" : causasPropias / causasMax > 0.8 ? "#f59e0b" : "var(--color-blue)",
              }}
            />
          </div>
        </div>

        {/* View toggle */}
        {onViewChange && (
          <div
            className="flex items-center gap-[2px] rounded-[7px] p-[3px]"
            style={{ background: "var(--color-border)" }}
          >
            {(["list", "grid"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                title={mode === "list" ? "Vista lista" : "Vista tarjetas"}
                onClick={() => onViewChange(mode)}
                className="flex cursor-pointer items-center justify-center rounded-[5px] p-[4px] transition-colors"
                style={{
                  background: viewMode === mode ? "var(--color-card)" : "transparent",
                  color: viewMode === mode ? "var(--color-blue)" : "var(--color-muted)",
                  boxShadow: viewMode === mode ? "0 1px 2px rgba(0,0,0,.1)" : undefined,
                }}
              >
                {mode === "list" ? <LayoutList size={13} /> : <LayoutGrid size={13} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
