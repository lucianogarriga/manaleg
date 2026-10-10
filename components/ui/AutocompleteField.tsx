"use client";

import { useEffect, useRef, useState } from "react";

const CONTROL =
  "w-full rounded-[6px] border border-border bg-bg px-[10px] py-[6px] text-[14px] text-text outline-none transition-colors placeholder:text-muted focus:border-blue focus:bg-card";

interface AutocompleteFieldProps {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
  onChangeValue?: (value: string) => void;
}

export default function AutocompleteField({
  label,
  name,
  options,
  defaultValue = "",
  placeholder,
  onChangeValue,
}: AutocompleteFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value.trim()
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  const select = (opt: string) => {
    setValue(opt);
    onChangeValue?.(opt);
    setOpen(false);
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); setHighlighted(0); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative block min-w-0">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[.4px] text-muted">
        {label}
      </span>
      {/* Hidden input que envía el valor al form */}
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        className={CONTROL}
        onChange={(e) => { setValue(e.target.value); onChangeValue?.(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => { setOpen(true); setHighlighted(0); }}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute left-0 right-0 z-[200] mt-1 max-h-[200px] overflow-y-auto rounded-[8px] border border-border bg-card shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              className="cursor-pointer px-3 py-[7px] text-[13px] text-text"
              style={{
                background: i === highlighted ? "var(--color-blue-lt)" : undefined,
                color: i === highlighted ? "var(--color-blue)" : undefined,
              }}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => select(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
