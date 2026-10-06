// Helpers para leer y validar FormData en Server Actions.

export function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

export function oneOf<T extends string>(value: string | null, options: readonly T[]): T | null {
  return value !== null && (options as readonly string[]).includes(value) ? (value as T) : null;
}

const MONTO_MAX = 999_999_999; // 9 dígitos — tope para pesos argentinos

// "4.200.000" / "$ 4200000,50" → 4200000.5. null si está vacío, "invalid" si no es número o supera el tope.
export function parseMonto(value: string | null): number | null | "invalid" {
  if (value === null) return null;
  const normalized = value.replace(/[$\s.]/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 && n <= MONTO_MAX ? n : "invalid";
}

export function isISODate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
