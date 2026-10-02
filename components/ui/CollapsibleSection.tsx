"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  headerAction?: React.ReactNode; // botón a la derecha del header (solo visible cuando open)
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
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 px-5 py-[13px] text-left"
      >
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
        <ChevronDown
          size={15}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Grid trick: animates between 0fr and 1fr for unknown-height content */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
