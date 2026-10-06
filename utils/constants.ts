export const TIPOS_GASTO = [
  "Carta documento",
  "Notificación",
  "Tasa de justicia",
  "Aporte previsional",
  "Pericial",
  "Honorarios peritos",
  "Medida cautelar",
  "Otro",
] as const;

export const FUEROS = [
  "Civil y Comercial",
  "Laboral",
  "Contencioso-Adm",
  "Penal",
  "Familia",
  "Extrajudicial",
  "Administrativo",
] as const;

export const VIAS_PROCESO = [
  "Judicial",
  "Mediación",
  "Defensa del Consumidor",
  "Administrativo",
  "Extrajudicial",
] as const;

// Tipos de juicio sugeridos por fuero (Córdoba, Argentina)
export const TIPOS_JUICIO_POR_FUERO: Record<string, string[]> = {
  "Civil y Comercial": [
    "Daños y perjuicios", "Cobro ejecutivo", "Cobro de pesos", "Desalojo",
    "Nulidad de acto jurídico", "Simulación", "Resolución de contrato",
    "Escrituración", "Rendición de cuentas", "Fijación de alimentos (civil)",
    "Sucesión", "Declaratoria de herederos", "Quiebra", "Concurso preventivo",
    "Pagarés y cheques", "Incidente de verificación", "Cobro de honorarios",
    "Accidente de tránsito", "Daño moral", "Mala praxis",
  ],
  "Laboral": [
    "Despido sin causa", "Despido indirecto", "Accidente de trabajo",
    "Enfermedad profesional", "Diferencias salariales", "Cobro de haberes",
    "Indemnización art. 212", "Multas ley 24.013", "Multas ley 25.345",
    "Reinstalación en el cargo", "Daños y perjuicios laborales",
    "Horas extras", "Categoría y salario",
  ],
  "Contencioso-Adm": [
    "Acción contencioso-administrativa", "Recurso de plena jurisdicción",
    "Recurso de anulación", "Amparo administrativo",
    "Acción de lesividad", "Ejecución fiscal", "Multa administrativa",
    "Habilitación de instancia",
  ],
  "Penal": [
    "Estafa", "Robo", "Hurto", "Lesiones", "Amenazas",
    "Violencia familiar", "Abuso sexual", "Homicidio",
    "Usurpación", "Incumplimiento de los deberes de asistencia familiar",
    "Defraudación", "Violación de domicilio", "Querella criminal",
    "Defensa penal", "Excarcelación", "Ejecución penal",
  ],
  "Familia": [
    "Divorcio vincular", "Alimentos", "Fijación de cuota alimentaria",
    "Cese de cuota alimentaria", "Régimen de comunicación",
    "Tenencia / cuidado personal", "Adopción",
    "Violencia familiar (medidas cautelares)", "Liquidación de sociedad conyugal",
    "Filiación", "Reconocimiento de hijo", "Inscripción tardía",
  ],
  "Extrajudicial": [
    "Mediación prejudicial", "Acuerdo extrajudicial",
    "Reclamo administrativo previo", "Carta documento",
    "Negociación directa",
  ],
  "Administrativo": [
    "Recurso administrativo", "Ejecución fiscal", "Multa tributaria",
    "Impugnación de acto administrativo", "Amparo",
    "Reclamo de daños al Estado",
  ],
};

// Tipo del próximo aviso de una causa
export const TIPOS_AVISO = ["Vencimiento", "Recordatorio", "Audiencia", "Alerta"] as const;

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
  "Acuerdo/Convenio",
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
