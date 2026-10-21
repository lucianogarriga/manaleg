import type { Honorario } from "@/types";

export const CONCEPTOS_HONORARIO = ["Consulta", "Asesoría", "Patrocinio", "Mensual", "Otro"] as const;

// Etiqueta de la moneda: "ARS", "USD" o el nombre de la moneda judicial usada (JUS, UMA, etc.).
export type MonedaHonorario = string;

export function etiquetaMoneda(h: { moneda: string; moneda_judicial_nombre?: string | null }): MonedaHonorario {
  if (h.moneda === "USD") return "USD";
  if (h.moneda === "JUS") return h.moneda_judicial_nombre || "JUS";
  return "ARS";
}

export interface Totales {
  acordado: number;
  cobrado: number;
  saldo: number;
}

// Totales separados por moneda. Los mensuales no suman saldo: su cobrado no tiene techo.
export function totalesPorMoneda(items: Honorario[]): Record<MonedaHonorario, Totales> {
  const t: Record<MonedaHonorario, Totales> = {};
  for (const h of items) {
    if (h.anulado) continue;
    const moneda = etiquetaMoneda(h);
    t[moneda] ??= { acordado: 0, cobrado: 0, saldo: 0 };
    t[moneda].cobrado += h.monto_cobrado;
    if (h.periodicidad === "unico") {
      t[moneda].acordado += h.monto_acordado;
      t[moneda].saldo += h.monto_acordado - h.monto_cobrado;
    }
  }
  return t;
}

export function ordenarMonedas(monedas: Iterable<MonedaHonorario>): MonedaHonorario[] {
  const orden = (m: string) => (m === "ARS" ? 0 : m === "USD" ? 1 : 2);
  return [...new Set(monedas)].sort((a, b) => orden(a) - orden(b) || a.localeCompare(b, "es"));
}

export function monedasPresentes(items: Honorario[]): MonedaHonorario[] {
  return ordenarMonedas(items.filter((h) => !h.anulado).map((h) => etiquetaMoneda(h)));
}
