// Análisis de un CSV de causas: valida cada fila y marca errores y duplicados.
// Se usa en el servidor (vista previa y carga). Nunca confía en el archivo del navegador.
import { ESTADOS_CAUSA, FUEROS } from "@/utils/constants";
import { parsearCsv } from "@/utils/csv";

export const MAX_FILAS_IMPORTACION = 500;

// Columnas que se importan, en el orden en que se exportan.
export const COLUMNAS_CAUSA = [
  "caratula",
  "nro_expediente",
  "fuero",
  "tipo_juicio",
  "juzgado_camara",
  "fecha_inicio",
  "monto_reclamado",
  "link_drive",
  "parte_actora",
  "parte_demandada",
  "estado",
  "notas",
] as const;

export type ColumnaCausa = (typeof COLUMNAS_CAUSA)[number];

export interface CausaImportada {
  caratula: string;
  nro_expediente: string | null;
  fuero: string | null;
  tipo_juicio: string | null;
  juzgado_camara: string | null;
  parte_actora: string | null;
  parte_demandada: string | null;
  fecha_inicio: string | null; // YYYY-MM-DD
  monto_reclamado: number | null;
  link_drive: string | null; // solo https
  estado: string;
  notas: string | null;
}

export interface FilaAnalizada {
  numero: number; // número de fila del archivo (1 = primera fila de datos)
  datos: CausaImportada | null; // null si la fila tiene errores
  errores: string[];
  duplicada: boolean; // el número de expediente ya existe en la cuenta o se repite en el archivo
}

export interface AnalisisCausas {
  errorGlobal?: string;
  columnasDesconocidas: string[];
  filas: FilaAnalizada[];
}

// Nombres aceptados en el encabezado, sin tildes y en minúsculas.
const ALIAS: Record<string, ColumnaCausa> = {
  caratula: "caratula",
  expediente: "nro_expediente",
  nro_expediente: "nro_expediente",
  numero_expediente: "nro_expediente",
  nro_expte: "nro_expediente",
  monto: "monto_reclamado",
  monto_reclamado: "monto_reclamado",
  "monto_$": "monto_reclamado",
  importe: "monto_reclamado",
  link: "link_drive",
  link_drive: "link_drive",
  link_carpeta_de_drive: "link_drive",
  link_carpeta: "link_drive",
  carpeta_drive: "link_drive",
  drive: "link_drive",
  fuero: "fuero",
  tipo_juicio: "tipo_juicio",
  tipo_de_juicio: "tipo_juicio",
  juzgado_camara: "juzgado_camara",
  juzgado: "juzgado_camara",
  camara: "juzgado_camara",
  parte_actora: "parte_actora",
  actor: "parte_actora",
  parte_demandada: "parte_demandada",
  demandado: "parte_demandada",
  fecha_inicio: "fecha_inicio",
  fecha: "fecha_inicio",
  estado: "estado",
  notas: "notas",
};

function normalizarEncabezado(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function textoOpcional(valor: string | undefined, max: number, etiqueta: string, errores: string[]): string | null {
  const t = (valor ?? "").trim();
  if (!t) return null;
  if (t.length > max) errores.push(`${etiqueta}: máximo ${max} caracteres.`);
  return t;
}

// Acepta 2026-10-15 o 15/10/2026. Devuelve YYYY-MM-DD o null si no es una fecha real.
function normalizarFecha(valor: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  const ddmm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(valor);
  let anio: number, mes: number, dia: number;
  if (iso) {
    [anio, mes, dia] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (ddmm) {
    [dia, mes, anio] = [Number(ddmm[1]), Number(ddmm[2]), Number(ddmm[3])];
  } else {
    return null;
  }
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Montos del CSV, en cualquiera de estos formatos:
//   150000 · 150000,50 · 150.000,50 (Argentina) · 1,500,000.00 (Excel en inglés) · $ 150.000
// El último separador (coma o punto) con 1 o 2 dígitos después es la coma decimal; el resto son miles.
const MONTO_MAX_CSV = 9_999_999_999;

export function parsearMontoCsv(valor: string): number | "invalid" {
  let limpio = valor.replace(/[$\s]/g, "");
  const ultimaComa = limpio.lastIndexOf(",");
  const ultimoPunto = limpio.lastIndexOf(".");
  const ultimoSep = Math.max(ultimaComa, ultimoPunto);

  if (ultimoSep >= 0) {
    const decimales = limpio.length - ultimoSep - 1;
    const esDecimal = decimales === 1 || decimales === 2;
    if (esDecimal) {
      const entera = limpio.slice(0, ultimoSep).replace(/[.,]/g, "");
      const dec = limpio.slice(ultimoSep + 1);
      limpio = `${entera}.${dec}`;
    } else {
      limpio = limpio.replace(/[.,]/g, "");
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return "invalid";
  const n = Number(limpio);
  return n <= MONTO_MAX_CSV ? n : "invalid";
}

function validarFila(
  celdas: Record<ColumnaCausa, string | undefined>,
  errores: string[],
): CausaImportada | null {
  const caratula = textoOpcional(celdas.caratula, 80, "Carátula", errores);
  if (!caratula) errores.push("Carátula: es obligatoria.");

  const nro = textoOpcional(celdas.nro_expediente, 60, "Número de expediente", errores);

  let fuero: string | null = null;
  const fueroTexto = textoOpcional(celdas.fuero, 50, "Fuero", errores);
  if (fueroTexto) {
    fuero = FUEROS.find((f) => f.toLowerCase() === fueroTexto.toLowerCase()) ?? null;
    if (!fuero) errores.push(`Fuero "${fueroTexto}" no existe. Opciones: ${FUEROS.join(", ")}.`);
  }

  let estado = "Iniciada";
  const estadoTexto = textoOpcional(celdas.estado, 30, "Estado", errores);
  if (estadoTexto) {
    const encontrado = ESTADOS_CAUSA.find((e) => e.toLowerCase() === estadoTexto.toLowerCase());
    if (encontrado) estado = encontrado;
    else errores.push(`Estado "${estadoTexto}" no existe. Opciones: ${ESTADOS_CAUSA.join(", ")}.`);
  }

  let fecha: string | null = null;
  const fechaTexto = (celdas.fecha_inicio ?? "").trim();
  if (fechaTexto) {
    fecha = normalizarFecha(fechaTexto);
    if (!fecha) errores.push(`Fecha de inicio "${fechaTexto}" no es válida. Usá DD/MM/AAAA o AAAA-MM-DD.`);
  }

  let monto: number | null = null;
  const montoTexto = (celdas.monto_reclamado ?? "").trim();
  if (montoTexto) {
    const parseado = parsearMontoCsv(montoTexto);
    if (parseado === "invalid") errores.push(`Monto "${montoTexto}" no es válido. Ejemplos: 150000, 150.000,50 o $ 150.000.`);
    else monto = parseado;
  }

  let linkDrive: string | null = null;
  const linkTexto = textoOpcional(celdas.link_drive, 500, "Link de Drive", errores);
  if (linkTexto) {
    if (/^https:\/\/\S+$/i.test(linkTexto)) linkDrive = linkTexto;
    else errores.push("Link de Drive: tiene que empezar con https://.");
  }

  const tipoJuicio = textoOpcional(celdas.tipo_juicio, 50, "Tipo de juicio", errores);
  const juzgado = textoOpcional(celdas.juzgado_camara, 50, "Juzgado/cámara", errores);
  const actora = textoOpcional(celdas.parte_actora, 150, "Parte actora", errores);
  const demandada = textoOpcional(celdas.parte_demandada, 150, "Parte demandada", errores);
  const notas = textoOpcional(celdas.notas, 500, "Notas", errores);

  if (errores.length > 0 || !caratula) return null;
  return {
    caratula,
    nro_expediente: nro,
    fuero,
    tipo_juicio: tipoJuicio,
    juzgado_camara: juzgado,
    parte_actora: actora,
    parte_demandada: demandada,
    fecha_inicio: fecha,
    monto_reclamado: monto,
    link_drive: linkDrive,
    estado,
    notas,
  };
}

// expedientesExistentes: números de expediente que el usuario ya tiene cargados.
export function analizarCsvCausas(texto: string, expedientesExistentes: Set<string>): AnalisisCausas {
  const filas = parsearCsv(texto);
  if (filas.length < 2) {
    return { errorGlobal: "El archivo no tiene filas de datos. La primera fila tiene que ser el encabezado.", columnasDesconocidas: [], filas: [] };
  }

  const encabezado = filas[0].map(normalizarEncabezado);
  const indice: Partial<Record<ColumnaCausa, number>> = {};
  const columnasDesconocidas: string[] = [];
  encabezado.forEach((nombre, i) => {
    const columna = ALIAS[nombre];
    if (columna) indice[columna] = i;
    else if (nombre) columnasDesconocidas.push(filas[0][i].trim());
  });

  if (indice.caratula === undefined) {
    return { errorGlobal: 'Falta la columna "caratula" en el encabezado.', columnasDesconocidas, filas: [] };
  }

  const datos = filas.slice(1);
  if (datos.length > MAX_FILAS_IMPORTACION) {
    return {
      errorGlobal: `El archivo tiene ${datos.length} filas. El máximo por importación es ${MAX_FILAS_IMPORTACION}.`,
      columnasDesconocidas,
      filas: [],
    };
  }

  const vistos = new Set<string>();
  const resultado: FilaAnalizada[] = datos.map((celdasCrudas, i) => {
    const celdas = {} as Record<ColumnaCausa, string | undefined>;
    for (const columna of COLUMNAS_CAUSA) {
      const pos = indice[columna];
      celdas[columna] = pos === undefined ? undefined : celdasCrudas[pos];
    }

    const errores: string[] = [];
    const datosFila = validarFila(celdas, errores);

    const nro = datosFila?.nro_expediente ?? null;
    let duplicada = false;
    if (nro) {
      duplicada = expedientesExistentes.has(nro) || vistos.has(nro);
      vistos.add(nro);
    }

    return { numero: i + 1, datos: datosFila, errores, duplicada };
  });

  return { columnasDesconocidas, filas: resultado };
}

// Fila de la tabla causas a partir de los datos validados.
export function aFilaCausa(c: CausaImportada) {
  return {
    ...c,
    anticipacion_alerta: "1 día",
    inactividad_dias: 7,
  };
}
