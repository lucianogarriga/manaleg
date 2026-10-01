"use client";

import { useCausasStore, type CausasFilter } from "@/store/causasStore";

const CHIPS: { value: CausasFilter; label: string; urgent?: boolean }[] = [
  { value: "todas", label: "Todas" },
  { value: "mias", label: "Mis causas" },
  { value: "compartidas", label: "Compartidas conmigo" },
  { value: "urgentes", label: "Urgentes", urgent: true },
  { value: "cerradas", label: "Cerradas" },
];

export default function FilterChips({ total }: { total: number }) {
  const filter = useCausasStore((s) => s.filter);
  const setFilter = useCausasStore((s) => s.setFilter);

  return (
    <div className="flex flex-wrap gap-[5px] border-b border-border px-3 py-2">
      {CHIPS.map((chip) => {
        const on = filter === chip.value;
        const style = on
          ? "border-blue bg-blue text-white"
          : chip.urgent
            ? "border-red-bd text-red hover:bg-red-lt"
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
            {chip.value === "todas" && ` (${total})`}
          </button>
        );
      })}
    </div>
  );
}
