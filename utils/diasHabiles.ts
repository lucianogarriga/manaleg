import { addDaysISO, dayOfWeekISO } from "./formatters";

// Cómputo de días hábiles: excluye sábados, domingos y los días inhábiles
// cargados (feriados, ferias judiciales). Todas las fechas son "YYYY-MM-DD".
export type Inhabiles = ReadonlySet<string>;

const MAX_LOOKAHEAD = 400; // corta bucles si el calendario estuviera todo inhábil

export function esFinDeSemana(iso: string): boolean {
  const dow = dayOfWeekISO(iso);
  return dow === 0 || dow === 6;
}

export function esHabil(iso: string, inhabiles: Inhabiles): boolean {
  return !esFinDeSemana(iso) && !inhabiles.has(iso);
}

// Primer día hábil posterior a `iso` (siempre después, nunca el mismo día)
export function siguienteHabil(iso: string, inhabiles: Inhabiles): string {
  let d = addDaysISO(iso, 1);
  for (let i = 0; i < MAX_LOOKAHEAD && !esHabil(d, inhabiles); i++) d = addDaysISO(d, 1);
  return d;
}

// Si `iso` no es hábil, el primer día hábil siguiente; si lo es, el mismo día
export function ajustarAHabil(iso: string, inhabiles: Inhabiles): string {
  return esHabil(iso, inhabiles) ? iso : siguienteHabil(iso, inhabiles);
}

export interface ResultadoPlazo {
  vencimiento: string; // último día del plazo
  graciaHasta: string; // día hábil siguiente (plazo de gracia)
  omitidos: { fecha: string; motivo: "Sábado" | "Domingo" | "Inhábil" }[]; // días que no se computaron
}

// Suma `dias` al plazo que comienza a correr al día siguiente de `desde`.
//  - "habiles":  solo cuentan los días hábiles.
//  - "corridos": cuentan todos los días; si el último cae en día inhábil, pasa al hábil siguiente.
export function calcularPlazo(
  desde: string,
  dias: number,
  tipo: "habiles" | "corridos",
  inhabiles: Inhabiles,
): ResultadoPlazo {
  const omitidos: ResultadoPlazo["omitidos"] = [];
  const motivo = (d: string) =>
    dayOfWeekISO(d) === 6 ? "Sábado" : dayOfWeekISO(d) === 0 ? "Domingo" : "Inhábil";

  let actual = desde;

  if (tipo === "habiles") {
    let contados = 0;
    for (let i = 0; contados < dias && i < MAX_LOOKAHEAD; i++) {
      actual = addDaysISO(actual, 1);
      if (esHabil(actual, inhabiles)) contados++;
      else omitidos.push({ fecha: actual, motivo: motivo(actual) });
    }
  } else {
    actual = addDaysISO(desde, dias);
    while (!esHabil(actual, inhabiles)) {
      omitidos.push({ fecha: actual, motivo: motivo(actual) });
      actual = addDaysISO(actual, 1);
    }
  }

  return { vencimiento: actual, graciaHasta: siguienteHabil(actual, inhabiles), omitidos };
}
