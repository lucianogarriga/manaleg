interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  aside?: React.ReactNode; // dato chico alineado a la derecha del rótulo
  tone?: "blue" | "red" | "amb" | "grn";
  small?: boolean; // número más chico (para montos)
}

const TONES = { blue: "text-blue", red: "text-red", amb: "text-amb", grn: "text-grn" };

export default function StatCard({ label, value, hint, aside, tone = "blue", small }: StatCardProps) {
  return (
    <div className="rounded-[7px] border border-border bg-card px-[13px] py-[11px]">
      <div className="mb-[3px] flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-[.3px] text-muted uppercase">{label}</span>
        {aside && <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted">{aside}</span>}
      </div>
      <div className={`leading-none font-extrabold ${small ? "mt-1 text-[18px]" : "text-[24px]"} ${TONES[tone]}`}>
        {value}
      </div>
      {hint && <div className="mt-px text-[11px] text-muted">{hint}</div>}
    </div>
  );
}
