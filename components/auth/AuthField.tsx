import type { InputHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

export default function AuthField({ label, name, ...props }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-[8.5px] font-bold uppercase tracking-[.4px] text-muted">
        {label}
      </span>
      <input
        name={name}
        className="w-full rounded-[6px] border border-border bg-bg px-[10px] py-[7px] text-[12.5px] text-text outline-none transition-colors placeholder:text-muted focus:border-blue focus:bg-card"
        {...props}
      />
    </label>
  );
}
