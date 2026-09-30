"use client";

import { useMemo } from "react";
import { useCausasStore, type CausasFilter } from "@/store/causasStore";
import { getUrgency } from "@/utils/urgencyHelpers";
import type { CausaConRelaciones } from "@/types";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Filtra y ordena la lista según el chip activo y el buscador del Topbar.
export function useCausas(causas: CausaConRelaciones[], userId: string) {
  const filter = useCausasStore((s) => s.filter);
  const search = useCausasStore((s) => s.search);

  return useMemo(() => {
    const isCerrada = (c: CausaConRelaciones) => c.estado === "Cerrada";
    const isUrgente = (c: CausaConRelaciones) =>
      getUrgency(c.proximo_vencimiento, isCerrada(c)) === "red";

    const matchers: Record<CausasFilter, (c: CausaConRelaciones) => boolean> = {
      todas: () => true,
      mias: (c) => c.user_id === userId,
      urgentes: isUrgente,
      cerradas: isCerrada,
    };

    const q = normalize(search.trim());
    const filtered = causas
      .filter(matchers[filter])
      .filter(
        (c) =>
          !q ||
          normalize(c.caratula).includes(q) ||
          normalize(c.nro_expediente ?? "").includes(q),
      )
      // Cerradas al final, el resto mantiene el orden por vencimiento
      .sort((a, b) => Number(isCerrada(a)) - Number(isCerrada(b)));

    return { causas: filtered, total: causas.length };
  }, [causas, filter, search, userId]);
}
