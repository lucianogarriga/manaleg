import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  icon?: LucideIcon;
  error?: string;
}

export default function AuthField({ label, name, icon: Icon, error, ...props }: AuthFieldProps) {
  return (
    <div className="block">
      <label className="block">
        <span className="mb-[7px] block text-[10.5px] font-bold uppercase tracking-[.6px]" style={{ color: "var(--color-muted)" }}>
          {label}
        </span>
        <div className="relative">
          {Icon && (
            <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2" style={{ color: error ? "var(--color-red)" : "var(--color-muted)" }}>
              <Icon size={15} strokeWidth={1.8} />
            </span>
          )}
          <input
            name={name}
            style={{
              background: "var(--color-card)",
              borderColor: error ? "var(--color-red)" : "var(--color-border)",
              color: "var(--color-text)",
            }}
            className={`w-full rounded-[9px] border text-[14px] outline-none transition-colors placeholder:text-muted focus:border-blue focus:bg-card ${
              Icon ? "pl-[36px] pr-[12px] py-[11px]" : "px-[12px] py-[11px]"
            }`}
            {...props}
          />
        </div>
      </label>
      {error && (
        <p className="mt-[5px] text-[12px]" style={{ color: "var(--color-red)" }}>{error}</p>
      )}
    </div>
  );
}
