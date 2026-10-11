"use client";

import { useLoadingStore } from "@/store/loadingStore";
import Spinner from "@/components/ui/Spinner";

export default function GlobalLoader() {
  const pending = useLoadingStore((s) => s.pending);
  if (pending === 0) return null;
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-[1px]"
      style={{ background: "color-mix(in srgb, var(--color-bg) 80%, transparent)", cursor: "wait" }}
    >
      <Spinner label="Cargando..." />
    </div>
  );
}
