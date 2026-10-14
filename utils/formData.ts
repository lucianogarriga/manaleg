// Helpers para leer y validar FormData en Server Actions.

export function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

export function oneOf<T extends string>(value: string | null, options: readonly T[]): T | null {
  return value !== null && (options as readonly string[]).includes(value) ? (value as T) : null;
}

const MONTO_MAX = 9_999_999_999; // cabe en NUMERIC(12,2) y DECIMAL(15,2)

// "4.200.000" → 4200000 · "4200000,50" o "1.234,50" → con coma decimal · "5000.50" → con punto decimal.
// null si está vacío, "invalid" si no es un monto válido o supera el tope.
export function parseMonto(value: string | null): number | null | "invalid" {
  if (value === null) return null;
  const limpio = value.replace(/[$\s]/g, "");
  let normalizado: string;
  if (limpio.includes(",")) normalizado = limpio.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) normalizado = limpio.replace(/\./g, "");
  else normalizado = limpio;

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return "invalid";
  const n = Number(normalizado);
  return n <= MONTO_MAX ? n : "invalid";
}

export function isISODate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
