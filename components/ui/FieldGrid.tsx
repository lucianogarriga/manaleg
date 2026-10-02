export interface Field {
  label: string;
  value: React.ReactNode;
  variant?: "default" | "mono" | "danger";
  full?: boolean; // ocupa las dos columnas
}

const VARIANTS = {
  default: "text-[14px] font-medium text-text",
  mono: "font-mono text-[13px] text-sub",
  danger: "text-[14px] font-bold text-red",
};

export default function FieldGrid({ fields }: { fields: Field[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-[18px] gap-y-[10px] px-[14px] py-3 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.label} className={f.full ? "sm:col-span-2" : undefined}>
          <div className="mb-[2px] text-[10px] font-bold uppercase tracking-[.4px] text-[#1e3a6e]/70">
            {f.label}
          </div>
          <div className={`break-words whitespace-pre-line ${VARIANTS[f.variant ?? "default"]}`}>
            {f.value}
          </div>
        </div>
      ))}
    </div>
  );
}
