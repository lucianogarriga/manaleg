export const FUEROS = [
  "Civil",
  "Comercial",
  "Laboral",
  "Contencioso-Adm",
  "Extrajudicial",
  "Administrativo",
] as const;

// Tipo del próximo aviso de una causa
export const TIPOS_AVISO = ["Vencimiento", "Alerta"] as const;

export const ESTADOS_CAUSA = [
  "Iniciada",
  "En trámite",
  "Con resolución",
  "En ejecución",
  "Cerrada",
] as const;

export const ANTICIPACION_ALERTA = ["1 día", "3 días", "1 semana"] as const;

export const TIPOS_MOVIMIENTO = [
  "Presentación",
  "Decreto",
  "Auto/Sentencia",
  "Resolución",
  "Audiencia",
  "Llamada",
  "Telegrama Ley/CD",
  "Pago",
  "Otro",
] as const;

export const TIPOS_EVENTO = [
  "Audiencia",
  "Mediación",
  "Pericial",
  "Reunión",
  "Otro",
] as const;

export const TIPOS_VENCIMIENTO = [
  "Plazo procesal",
  "Audiencia",
  "Prescripción",
  "Pacto honorarios",
  "Otro",
] as const;

// Colores de los status badges
export const ESTADO_STYLES: Record<(typeof ESTADOS_CAUSA)[number], { bg: string; text: string }> = {
  Iniciada: { bg: "bg-pur-lt", text: "text-pur" },
  "En trámite": { bg: "bg-blue-lt", text: "text-blue" },
  "Con resolución": { bg: "bg-grn-lt", text: "text-grn" },
  "En ejecución": { bg: "bg-amb-lt", text: "text-amb" },
  Cerrada: { bg: "bg-gray-100", text: "text-muted" },
};
