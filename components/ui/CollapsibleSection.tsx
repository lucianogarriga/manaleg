"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  titleInfo?: React.ReactNode;
  headerAction?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  titleInfo,
  headerAction,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mx-4 mb-[6px] overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_4px_0_rgba(0,0,0,0.06)] last:mb-0">
      {/* Fila del header: toggle-button + action separados para evitar button-dentro-de-button */}
      <div
        className="flex items-center gap-[10px] px-4 transition-colors duration-150"
        style={{ background: open ? "var(--color-card)" : undefined }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = ""; }}
      >
        <div className="flex flex-1 items-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-[10px] py-[11px] text-left"
          >
            <ChevronDown
              size={14}
              className={`shrink-0 text-blue/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
            <span className="text-[12px] font-bold uppercase tracking-[.5px] text-sub">
              {title}
            </span>
          </button>
          {titleInfo && (
            <span className="ml-[5px] shrink-0 py-[11px]">
              {titleInfo}
            </span>
          )}
        </div>
        {headerAction && open && (
          <span className="shrink-0 py-[11px]">
            {headerAction}
          </span>
        )}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60 bg-card">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
