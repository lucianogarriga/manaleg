// Límite de causas cargadas en memoria (fase beta). Cambiar cuando se implemente paginación.
export const CAUSAS_LIMIT = 60;

// Versión vigente de T&C. Incrementar (ej: "1.1") cuando se publiquen cambios
// que requieran nueva aceptación. AuthGuard redirige a /tyc-update si el perfil
// tiene una versión anterior.
export const CURRENT_TYC_VERSION = "1.1";

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
  "Federal",
  "Comercial",
  "Ciberdelitos",
  "Defensa del Consumidor",
  "Otro",
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
  "Federal": [
    "Amparo federal", "Ejecución fiscal (AFIP/ARCA)", "Recurso de apelación fiscal",
    "Contencioso administrativo federal", "Delitos federales", "Extradición",
    "Cuestiones de competencia federal", "Acción de inconstitucionalidad",
  ],
  "Comercial": [
    "Concurso preventivo", "Quiebra", "Pagarés y cheques", "Cobro ejecutivo mercantil",
    "Disolución de sociedad", "Sociedades comerciales", "Marcas y patentes",
    "Contratos comerciales", "Competencia desleal", "Defensa del consumidor",
  ],
};

// Alias de tipo_juicio → nombre canónico (para deduplicar el filtro)
export const TIPO_JUICIO_ALIASES: Record<string, string> = {
  "denuncia defensa del consumidor": "Defensa del Consumidor",
};

export function normalizeTipoJuicio(raw: string): string {
  const key = raw.trim().toLowerCase();
  return TIPO_JUICIO_ALIASES[key] ?? raw.trim();
}

// Meses en español (nombre completo, para calendarios y dashboards)
export const MESES_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

// Abreviaturas para labels de gráficos de la vía de proceso
export const VIA_LABELS: Record<string, string> = {
  "Judicial":               "JUD",
  "Mediación":              "MED",
  "Administrativo":         "ADM",
  "Extrajudicial":          "EXT",
  "Defensa del Consumidor": "DEF",
};

// Tipo del próximo aviso de una causa
export const TIPOS_AVISO = ["Vencimiento", "Recordatorio", "Audiencia"] as const;

// Etapas según la vía de proceso: cada una tiene las suyas
export const ETAPAS_POR_VIA: Record<string, readonly string[]> = {
  Judicial: ["Inicial", "Prueba", "Alegatos", "Sentencia", "Ejecución"],
  Mediación: ["Iniciada", "Audiencia de mediación", "Propuesta", "Cierre"],
  "Defensa del Consumidor": ["Reclamo", "Audiencia de conciliación", "Propuesta", "Resolución/Acta de cierre"],
  Administrativo: ["Reclamo administrativo", "Propuesta", "Peritaje", "Resolución"],
  Extrajudicial: ["Inicial", "Negociación", "Intimación", "Cierre"],
};

// Vías dentro de "Extrajudicial" (la instancia). El valor "Extrajudicial" es la categoría genérica.
export const VIAS_EXTRAJUDICIALES = [
  { value: "Mediación", label: "Mediación" },
  { value: "Defensa del Consumidor", label: "Defensa del consumidor" },
  { value: "Administrativo", label: "Administrativo" },
  { value: "Extrajudicial", label: "Otra extrajudicial" },
];

// Todas las etapas posibles (para validar en el servidor)
export const ETAPAS_PROCESALES: string[] = [...new Set(Object.values(ETAPAS_POR_VIA).flat())];

// Resultados posibles en la base. "Transada" se muestra como "Acuerdo".
export const RESULTADOS_CAUSA = ["Ganada", "Transada", "Perdida", "Sin acuerdo"] as const;

export const ETIQUETA_RESULTADO: Record<string, string> = {
  Ganada: "Ganada",
  Transada: "Acuerdo",
  Perdida: "Perdida",
  "Sin acuerdo": "Sin acuerdo",
};

// Judicial: ganada, acuerdo o perdida. Extrajudicial (consumidor, audiencias, mediación, administrativo): también "sin acuerdo".
export function resultadosPara(via: string): string[] {
  return via === "" || via === "Judicial"
    ? ["Ganada", "Transada", "Perdida"]
    : ["Ganada", "Transada", "Sin acuerdo", "Perdida"];
}

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

// Colores de los status badges
export const ESTADO_STYLES: Record<(typeof ESTADOS_CAUSA)[number], { bg: string; text: string }> = {
  Iniciada: { bg: "bg-pur-lt", text: "text-pur" },
  "En trámite": { bg: "bg-blue-lt", text: "text-blue" },
  "Con resolución": { bg: "bg-grn-lt", text: "text-grn" },
  "En ejecución": { bg: "bg-amb-lt", text: "text-amb" },
  Cerrada: { bg: "bg-gray-100", text: "text-muted" },
};
