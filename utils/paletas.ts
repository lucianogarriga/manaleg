export const PALETAS = [
  { id: "opcion1", label: "Navy", muestra: ["#1A1A18", "#8DC1E3", "#5DB8DC"] },
  { id: "claude", label: "Coral", muestra: ["#D97757", "#B85A39", "#F0EEE6"] },
] as const;

export type PaletaId = (typeof PALETAS)[number]["id"];

export function esPaletaValida(valor: unknown): valor is PaletaId {
  return PALETAS.some((p) => p.id === valor);
}
