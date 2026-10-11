"use client";

import { useEffect } from "react";
import { useLoadingStore } from "@/store/loadingStore";

export function useGlobalLoading(active: boolean) {
  useEffect(() => {
    if (!active) return;
    useLoadingStore.getState().start();
    return () => useLoadingStore.getState().stop();
  }, [active]);
}
