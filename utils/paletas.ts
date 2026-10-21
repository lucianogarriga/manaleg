export const PALETAS = [
  { id: "opcion2", label: "Black", muestra: ["#1A1A18", "#5E9CA4", "#D9A154"] },
  { id: "opcion1", label: "Navy", muestra: ["#0C0F13", "#3A74B5", "#5DB8DC"] },
  { id: "claude", label: "Coral", muestra: ["#D97757", "#B85A39", "#F0EEE6"] },
  { id: "pastel", label: "Pastel", muestra: ["#A8D5C8", "#E8B9A0", "#F2C57C"] },
] as const;

export type PaletaId = (typeof PALETAS)[number]["id"];

export function esPaletaValida(valor: unknown): valor is PaletaId {
  return PALETAS.some((p) => p.id === valor);
}
