import type { Honorario } from "@/types";

export const CONCEPTOS_HONORARIO = ["Consulta", "Asesoría", "Patrocinio", "Mensual", "Otro"] as const;
export type MonedaHonorario = "ARS" | "USD";

export interface Totales {
  acordado: number;
  cobrado: number;
  saldo: number;
}

// Totales separados por moneda. Los mensuales no suman saldo: su cobrado no tiene techo.
export function totalesPorMoneda(items: Honorario[]): Record<MonedaHonorario, Totales> {
  const t: Record<MonedaHonorario, Totales> = {
    ARS: { acordado: 0, cobrado: 0, saldo: 0 },
    USD: { acordado: 0, cobrado: 0, saldo: 0 },
  };
  for (const h of items) {
    const moneda: MonedaHonorario = h.moneda === "USD" ? "USD" : "ARS";
    t[moneda].cobrado += h.monto_cobrado;
    if (h.periodicidad === "unico") {
      t[moneda].acordado += h.monto_acordado;
      t[moneda].saldo += h.monto_acordado - h.monto_cobrado;
    }
  }
  return t;
}

export function monedasPresentes(items: Honorario[]): MonedaHonorario[] {
  const set = new Set(items.map((h) => (h.moneda === "USD" ? "USD" : "ARS")) as MonedaHonorario[]);
  return (["ARS", "USD"] as const).filter((m) => set.has(m));
}
