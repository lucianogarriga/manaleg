import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const CONTROL =
  "w-full rounded-[6px] border border-border bg-bg px-[10px] py-[6px] text-[14px] text-text outline-none transition-colors placeholder:text-muted focus:border-blue focus:bg-card";

function Label({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[.4px] text-muted">
        {label}
        {required && <span className="text-red"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function TextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <Label label={label} required={props.required}>
      <input className={CONTROL} {...props} />
    </Label>
  );
}

export function SelectField({
  label,
  options,
  placeholder,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
}) {
  return (
    <Label label={label} required={props.required}>
      <select className={`${CONTROL} cursor-pointer`} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const { value, label: text } = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </Label>
  );
}

export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <Label label={label} required={props.required}>
      <textarea className={`${CONTROL} min-h-[70px] resize-y`} {...props} />
    </Label>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-border px-4 py-3 last:border-b-0">
      <legend className="float-left mb-2 w-full text-[12px] font-bold uppercase tracking-[.4px] text-sub">
        {title}
      </legend>
      <div className="clear-both grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
