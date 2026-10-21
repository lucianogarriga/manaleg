export const PALETAS = [
  { id: "opcion1", label: "Opción 1" },
  { id: "opcion2", label: "Opción 2" },
] as const;

export type PaletaId = (typeof PALETAS)[number]["id"];

export function esPaletaValida(valor: unknown): valor is PaletaId {
  return PALETAS.some((p) => p.id === valor);
}
