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

// Día de la semana de una fecha "YYYY-MM-DD" (0 = domingo … 6 = sábado)
export function dayOfWeekISO(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

// "2026-09-11" → "Vie 11 sep 2026"
export function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "2026-09-11" → "11/09/2026"
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// "Hoy, 10:15" / "08/09/2026, 16:40" (hora de Argentina)
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const fecha = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
  const hora = new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${fecha === todayISO() ? "Hoy" : formatDate(fecha)}, ${hora}`;
}

// 4200000 → "$4.200.000"
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, "");
}

// Días desde hoy (Argentina) hasta una fecha "YYYY-MM-DD". Negativo = ya pasó.
export function getDaysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const hoy = new Date(`${todayISO()}T00:00:00Z`).getTime();
  const fecha = new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((fecha - hoy) / 86_400_000);
}

// "Luciano Garriga" → "LG"
export function getInitials(nombre: string | null | undefined, fallback = "?"): string {
  const parts = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
