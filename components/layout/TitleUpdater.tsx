"use client";

import { useEffect } from "react";

export default function TitleUpdater({ urgentes }: { urgentes: number }) {
  useEffect(() => {
    document.title = urgentes > 0 ? `(${urgentes}) Manaleg` : "Manaleg";
  }, [urgentes]);

  return null;
}
