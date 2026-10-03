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
      <span className="mb-[7px] block text-[10.5px] font-bold uppercase tracking-[.6px]" style={{ color: "#94a3b8" }}>
        {label}
      </span>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }}>
            <Icon size={15} strokeWidth={1.8} />
          </span>
        )}
        <input
          name={name}
          style={{
            background: "#ffffff",
            borderColor: "#e2e8f0",
            color: "#0f172a",
          }}
          className={`w-full rounded-[9px] border text-[14px] outline-none transition-colors placeholder:text-[#cbd5e1] focus:border-[#2563eb] focus:bg-white ${
            Icon ? "pl-[36px] pr-[12px] py-[11px]" : "px-[12px] py-[11px]"
          }`}
          {...props}
        />
      </div>
    </label>
  );
}
