// Zona horaria de referencia: el servidor (Vercel) corre en UTC,
// así que "hoy" siempre se calcula en hora argentina.
export const TIME_ZONE = "America/Argentina/Cordoba";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Fecha actual en Argentina como "YYYY-MM-DD" (mismo formato que DATE de Postgres)
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

// Suma días a una fecha "YYYY-MM-DD"
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "2026-09-11" → "Vie 11 sep 2026"
export function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "Luciano Garriga" → "LG"
export function getInitials(nombre: string | null | undefined, fallback = "?"): string {
  const parts = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
