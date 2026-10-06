"use client";

import { useCausasStore, type CausasFilter } from "@/store/causasStore";

const CHIPS: { value: CausasFilter; label: string; urgent?: boolean; color?: string }[] = [
  { value: "todas",        label: "Todas" },
  { value: "mias",         label: "Mis causas" },
  { value: "compartidas",  label: "Compartidas" },
  { value: "urgentes",     label: "Urgentes", urgent: true },
  { value: "audiencias",   label: "Audiencias",   color: "purple" },
  { value: "vencimientos", label: "Vencimientos", color: "amber" },
  { value: "recordatorios",label: "Recordatorios",color: "blue" },
  { value: "cerradas",     label: "Cerradas" },
];

interface FilterChipsProps {
  total: number;
  counts?: Partial<Record<CausasFilter, number>>;
}

export default function FilterChips({ total, counts = {} }: FilterChipsProps) {
  const filter = useCausasStore((s) => s.filter);
  const setFilter = useCausasStore((s) => s.setFilter);

  return (
    <div className="flex flex-wrap gap-[5px] border-b border-border px-3 py-2">
      {CHIPS.map((chip) => {
        const on = filter === chip.value;
        const count = chip.value === "todas" ? total : (counts[chip.value] ?? 0);
        const style = on
          ? "border-blue bg-blue text-white"
          : chip.urgent
            ? "border-red-bd text-red hover:bg-red-lt"
            : chip.color === "purple"
              ? "border-pur-lt text-pur hover:bg-pur-lt"
              : chip.color === "amber"
                ? "border-amb-lt text-amb hover:bg-amb-lt"
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
  );
}
