import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  icon?: LucideIcon;
}

export default function AuthField({ label, name, icon: Icon, ...props }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-[7px] block text-[10.5px] font-bold uppercase tracking-[.6px] text-muted">
        {label}
      </span>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-muted">
            <Icon size={15} strokeWidth={1.8} />
          </span>
        )}
        <input
          name={name}
          className={`w-full rounded-[9px] border border-border bg-bg text-[14px] text-text outline-none transition-colors placeholder:text-muted/60 focus:border-blue focus:bg-card ${
            Icon ? "pl-[36px] pr-[12px] py-[11px]" : "px-[12px] py-[11px]"
          }`}
          {...props}
        />
      </div>
    </label>
  );
}
