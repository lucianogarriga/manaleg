interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "blue" | "red" | "amb" | "grn";
  small?: boolean; // número más chico (para montos)
}

const TONES = { blue: "text-blue", red: "text-red", amb: "text-amb", grn: "text-grn" };

export default function StatCard({ label, value, hint, tone = "blue", small }: StatCardProps) {
  return (
    <div className="rounded-[7px] border border-border bg-card px-[13px] py-[11px]">
      <div className="mb-[3px] text-[11px] font-semibold tracking-[.3px] text-muted uppercase">{label}</div>
      <div className={`leading-none font-extrabold ${small ? "mt-1 text-[18px]" : "text-[24px]"} ${TONES[tone]}`}>
        {value}
      </div>
      {hint && <div className="mt-px text-[11px] text-muted">{hint}</div>}
    </div>
  );
}
