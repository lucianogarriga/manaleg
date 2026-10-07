"use client";

import { useState } from "react";

const MAX = 100;

export default function MovimientoDescripcion({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > MAX;
  const shown = !long || expanded ? text : text.slice(0, MAX).trimEnd() + "…";

  return (
    <div className="text-[13.5px] leading-[1.4] break-words whitespace-pre-line text-text">
      {shown}
      {long && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-1 cursor-pointer text-[12px] text-blue hover:underline"
        >
          ver más
        </button>
      )}
    </div>
  );
}
