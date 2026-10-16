// Helpers para leer y validar FormData en Server Actions.

export function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

export function oneOf<T extends string>(value: string | null, options: readonly T[]): T | null {
  return value !== null && (options as readonly string[]).includes(value) ? (value as T) : null;
}

const MONTO_MAX = 9_999_999_999; // cabe en NUMERIC(12,2) y DECIMAL(15,2)

// Acepta cualquier formato de número habitual:
//   150000 · 150000,50 · 150.000,50 (Argentina) · 1,500,000.00 (Excel en inglés) · $ 150.000 · 5000.50
// Regla: el último separador (coma o punto) seguido de 1 o 2 dígitos es la coma decimal;
// los demás separadores son de miles. Devuelve null si está vacío, "invalid" si no es un monto válido.
export function parseMonto(value: string | null): number | null | "invalid" {
  if (value === null) return null;
  let limpio = value.replace(/[$\s]/g, "");
  if (limpio === "") return null;

  const ultimoSep = Math.max(limpio.lastIndexOf(","), limpio.lastIndexOf("."));
  if (ultimoSep >= 0) {
    const decimales = limpio.length - ultimoSep - 1;
    if (decimales === 1 || decimales === 2) {
      const entera = limpio.slice(0, ultimoSep).replace(/[.,]/g, "");
      limpio = `${entera}.${limpio.slice(ultimoSep + 1)}`;
    } else {
      limpio = limpio.replace(/[.,]/g, "");
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return "invalid";
  const n = Number(limpio);
  return n <= MONTO_MAX ? n : "invalid";
}

export function isISODate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
