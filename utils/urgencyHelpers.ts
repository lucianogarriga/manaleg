import type { TipoAviso } from "@/types";
import { formatDate, getDaysUntil } from "./formatters";

// Niveles de urgencia según días al próximo vencimiento (criterio del mockup):
//   red   → vencido o vence en ≤ 2 días
//   amber → vence en 3 a 5 días
//   green → vencimiento más adelante
//   none  → sin vencimiento cargado (o causa cerrada)
export type Urgency = "red" | "amber" | "green" | "none";

export function getUrgency(proximoVencimiento: string | null, cerrada = false): Urgency {
  if (cerrada) return "none";
  const days = getDaysUntil(proximoVencimiento);
  if (days === null) return "none";
  if (days <= 2) return "red";
  if (days <= 5) return "amber";
  return "green";
}

export const URGENCY_BORDER: Record<Urgency, string> = {
  red: "border-l-red",
  amber: "border-l-amb",
  green: "border-l-grn",
  none: "border-l-transparent",
};

export const URGENCY_DOT: Record<Urgency, string> = {
  red: "bg-red",
  amber: "bg-amb",
  green: "bg-grn",
  none: "bg-slate-300",
};

export const URGENCY_TEXT: Record<Urgency, string> = {
  red: "text-red font-semibold",
  amber: "text-amb",
  green: "text-sub",
  none: "text-sub",
};

// "Vence mañana", "Alerta en 5 días", "Venció hace 2 días"...
// El verbo depende del tipo de aviso: Vencimiento → "Vence", Alerta → "Alerta".
export function getDeadlineLabel(
  proximoVencimiento: string | null,
  tipo: TipoAviso | null = "Vencimiento",
): string | null {
  const days = getDaysUntil(proximoVencimiento);
  if (days === null) return null;
  const esAlerta = tipo === "Alerta";
  if (days < -1) return `${esAlerta ? "Alerta de" : "Venció"} hace ${-days} días`;
  if (days === -1) return esAlerta ? "Alerta de ayer" : "Venció ayer";
  if (days === 0) return esAlerta ? "Alerta hoy" : "Vence hoy";
  if (days === 1) return esAlerta ? "Alerta mañana" : "Vence mañana";
  if (days <= 5) return esAlerta ? `Alerta en ${days} días` : `Vence en ${days} días`;
  return formatDate(proximoVencimiento);
}

// Texto compacto para la fila del listado de causas
export function getRowDeadlineText(
  proximoVencimiento: string | null,
  tipo: TipoAviso | null,
  motivo: string | null,
): string {
  const days = getDaysUntil(proximoVencimiento);
  if (days === null) return "Sin vto";
  let label: string;
  if (days < 0) label = "Vencido";
  else if (days === 0) label = "Hoy";
  else if (days === 1) label = "Mañana";
  else if (days <= 5) label = `(${days} días)`;
  else label = formatDate(proximoVencimiento)!;
  return motivo ? `${label} · ${motivo}` : label;
}
