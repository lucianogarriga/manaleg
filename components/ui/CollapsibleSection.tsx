"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  headerAction?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  headerAction,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mx-4 mb-[6px] overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_4px_0_rgba(0,0,0,0.06)] last:mb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center gap-[10px] px-4 py-[11px] text-left transition-colors ${open ? "bg-card" : "hover:bg-slate-50/80"}`}
      >
        <ChevronDown
          size={14}
          className={`shrink-0 text-blue/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        <span className="flex-1 text-[12px] font-bold uppercase tracking-[.5px] text-sub">
          {title}
        </span>
        {headerAction && open && (
          <span
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] font-semibold normal-case tracking-normal text-blue hover:underline"
          >
            {headerAction}
          </span>
        )}
      </button>

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
