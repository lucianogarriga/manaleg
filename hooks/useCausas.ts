"use client";

import { useMemo } from "react";
import { useCausasStore, type CausasFilter } from "@/store/causasStore";
import { getDaysUntil } from "@/utils/formatters";
import { getUrgency } from "@/utils/urgencyHelpers";
import { normalizeTipoJuicio } from "@/utils/constants";
import type { CausaConRelaciones } from "@/types";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Filtra y ordena la lista según el chip activo y el buscador del Topbar.
export function useCausas(causas: CausaConRelaciones[], userId: string) {
  const filter = useCausasStore((s) => s.filter);
  const search = useCausasStore((s) => s.search);
  const fueros = useCausasStore((s) => s.fueros);
  const tipoJuicio = useCausasStore((s) => s.tipoJuicio);

  return useMemo(() => {
    const isCerrada = (c: CausaConRelaciones) => c.estado === "Cerrada";
    const isUrgente = (c: CausaConRelaciones) =>
      getUrgency(c.proximo_vencimiento, isCerrada(c)) === "red";

    const sharesCount = (c: CausaConRelaciones) => c.causa_shares?.length ?? 0;

    const matchers: Record<CausasFilter, (c: CausaConRelaciones) => boolean> = {
      todas: () => true,
      mias: (c) => c.user_id === userId && sharesCount(c) === 0,
      compartidas: (c) => sharesCount(c) > 0,
      urgentes: isUrgente,
      cerradas: isCerrada,
      vencen_hoy: (c) => {
        if (!c.proximo_vencimiento || isCerrada(c)) return false;
        return (getDaysUntil(c.proximo_vencimiento) ?? Infinity) <= 1;
      },
      vencen_3dias: (c) => {
        if (!c.proximo_vencimiento || isCerrada(c)) return false;
        const d = getDaysUntil(c.proximo_vencimiento) ?? Infinity;
        return d > 1 && d <= 3;
      },
      sin_movimiento: (c) => {
        if (isCerrada(c)) return false;
        const ref = c.fecha_ultimo_movimiento ?? c.created_at.slice(0, 10);
        return -(getDaysUntil(ref) ?? 0) >= 7;
      },
      audiencias: (c) =>
        !isCerrada(c) && c.tipo_vencimiento === "Audiencia" && c.proximo_vencimiento !== null,
      recordatorios: (c) =>
        !isCerrada(c) && (c.tipo_vencimiento === "Recordatorio" || (c.tipo_vencimiento as string) === "Alerta") && c.proximo_vencimiento !== null,
      vencimientos: (c) =>
        !isCerrada(c) && c.tipo_vencimiento === "Vencimiento" && c.proximo_vencimiento !== null,
    };

    const VIA_MAP: Record<string, string> = {
      "Judicial": "JUD", "Mediación": "MED", "Administrativo": "ADM",
      "Extrajudicial": "EXT", "Defensa del Consumidor": "DEF",
    };

    const q = normalize(search.trim());
    const filtered = causas
      .filter(matchers[filter])
      .filter((c) => fueros.size === 0 || fueros.has(VIA_MAP[c.via_proceso ?? ""] ?? ""))
      .filter((c) => !tipoJuicio || normalizeTipoJuicio(c.tipo_juicio ?? "") === tipoJuicio)
      .filter(
        (c) =>
          !q ||
          normalize(c.caratula).includes(q) ||
          normalize(c.nro_expediente ?? "").includes(q),
      )
      // Cerradas al final, el resto mantiene el orden por vencimiento
      .sort((a, b) => Number(isCerrada(a)) - Number(isCerrada(b)));

    const counts = {} as Record<CausasFilter, number>;
    for (const key of Object.keys(matchers) as CausasFilter[]) {
      counts[key] = causas.filter(matchers[key]).length;
    }

    return { causas: filtered, total: causas.length, counts };
  }, [causas, filter, search, fueros, tipoJuicio, userId]);
}
