"use server";

import { revalidatePath } from "next/cache";
import { createCausa, deleteCausa as deleteCausaService, saveCausaPartes, updateCausa } from "@/services/supabase/causas";
import { createClient } from "@/services/supabase/server";
import { ANTICIPACION_ALERTA, ESTADOS_CAUSA, FUEROS, TIPOS_AVISO, VIAS_PROCESO } from "@/utils/constants";
import { oneOf, parseMonto, text } from "@/utils/formData";
import type { CaracterAbogado, CausaInput, FormState, RolParte, TipoPersona } from "@/types";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export interface CausaFormState extends FormState {
  savedId?: string; // id de la causa creada/editada, para seleccionarla
}

const VALID_ROLES: RolParte[] = ["actora","demandada","solicitante","requirente","solicitado","requerido","tercero","tercerista","adquirente","otro"];
const VALID_TIPOS: TipoPersona[] = ["fisica","juridica"];
const VALID_CARACTER: CaracterAbogado[] = ["apoderado","patrocinante"];

interface ParteInput {
  nombre: string;
  tipo_persona: TipoPersona;
  rol: RolParte;
  es_nuestra_parte: boolean;
  caracter_abogado: CaracterAbogado | null;
  orden: number;
}

function parsePartes(raw: string): { partes?: ParteInput[]; error?: string } {
  let parsed: unknown;
  try { parsed = JSON.parse(raw || "[]"); } catch { return { error: "Error al leer las partes." }; }
  if (!Array.isArray(parsed)) return { error: "Formato de partes inválido." };

  const partes: ParteInput[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i] as Record<string, unknown>;
    const nombre = (typeof p.nombre === "string" ? p.nombre : "").trim();
    if (!nombre) return { error: `La parte ${i + 1} debe tener un nombre.` };
    if (nombre.length > 150) return { error: `El nombre de la parte ${i + 1} es demasiado largo (máx. 150 caracteres).` };
    const rol = VALID_ROLES.includes(p.rol as RolParte) ? (p.rol as RolParte) : null;
    if (!rol) return { error: `La parte ${i + 1} tiene un rol inválido.` };
    const tipo_persona = VALID_TIPOS.includes(p.tipo_persona as TipoPersona) ? (p.tipo_persona as TipoPersona) : "fisica";
    const es_nuestra_parte = Boolean(p.es_nuestra_parte);
    const caracter_abogado = es_nuestra_parte && VALID_CARACTER.includes(p.caracter_abogado as CaracterAbogado)
      ? (p.caracter_abogado as CaracterAbogado) : null;
    partes.push({ nombre, tipo_persona, rol, es_nuestra_parte, caracter_abogado, orden: i });
  }
  return { partes };
}

function parseCausa(formData: FormData): { input?: CausaInput; error?: string } {
  const caratula = text(formData, "caratula");
  if (!caratula) return { error: "La carátula es obligatoria." };
  if (caratula.length > 80) return { error: "La carátula es demasiado larga (máx. 80 caracteres)." };

  const monto = parseMonto(text(formData, "monto_reclamado"));
  if (monto === "invalid") return { error: "El monto reclamado no es un número válido." };

  const inactividad = Number(text(formData, "inactividad_dias") ?? 7);
  if (!Number.isInteger(inactividad) || inactividad < 1 || inactividad > 365)
    return { error: "Los días de inactividad deben estar entre 1 y 365." };

  const proximoVencimiento = text(formData, "proximo_vencimiento");
  const motivoVencimiento = text(formData, "motivo_vencimiento");
  if (motivoVencimiento && motivoVencimiento.length > 100) return { error: "El motivo del vencimiento es demasiado largo (máx. 100 caracteres)." };

  const nroExpediente = text(formData, "nro_expediente");
  if (nroExpediente && nroExpediente.length > 60) return { error: "El número de expediente es demasiado largo (máx. 60 caracteres)." };

  const tipoJuicio = text(formData, "tipo_juicio");
  if (tipoJuicio && tipoJuicio.length > 50) return { error: "El tipo de juicio es demasiado largo (máx. 50 caracteres)." };

  const juzgadoCamara = text(formData, "juzgado_camara");
  if (juzgadoCamara && juzgadoCamara.length > 50) return { error: "El juzgado/cámara es demasiado largo (máx. 50 caracteres)." };

  const notas = text(formData, "notas");
  if (notas && notas.length > 500) return { error: "Las notas son demasiado largas (máx. 500 caracteres)." };

  const link = text(formData, "link_drive");
  if (link && !/^https?:\/\//i.test(link))
    return { error: "El link de Drive debe empezar con https://" };

  return {
    input: {
      caratula,
      nro_expediente: nroExpediente,
      fuero: oneOf(text(formData, "fuero"), FUEROS),
      tipo_juicio: tipoJuicio,
      juzgado_camara: juzgadoCamara,
      cliente_id: text(formData, "cliente_id"),
      estado: oneOf(text(formData, "estado"), ESTADOS_CAUSA) ?? "Iniciada",
      via_proceso: oneOf(text(formData, "via_proceso"), VIAS_PROCESO),
      fecha_inicio: text(formData, "fecha_inicio"),
      proximo_vencimiento: proximoVencimiento,
      tipo_vencimiento: proximoVencimiento
        ? (oneOf(text(formData, "tipo_vencimiento"), TIPOS_AVISO) ?? "Vencimiento")
        : null,
      motivo_vencimiento: proximoVencimiento ? motivoVencimiento : null,
      anticipacion_alerta: oneOf(text(formData, "anticipacion_alerta"), ANTICIPACION_ALERTA) ?? "1 día",
      inactividad_dias: inactividad,
      monto_reclamado: monto,
      link_drive: link,
      notas,
    },
  };
}

export async function saveCausa(_prev: CausaFormState, formData: FormData): Promise<CausaFormState> {
  if (!await requireUser()) return { error: "No autenticado." };

  const id = text(formData, "id");
  const { input, error } = parseCausa(formData);
  if (!input) return { error };

  const { partes, error: partesError } = parsePartes(text(formData, "partes") ?? "[]");
  if (!partes) return { error: partesError };

  const result = id ? await updateCausa(id, input) : await createCausa(input);

  if (result.error || !result.data) {
    return { error: `No se pudo guardar la causa: ${result.error?.message ?? "sin respuesta"}` };
  }

  const savedId = result.data.id;
  const partesResult = await saveCausaPartes(savedId, partes);
  if (partesResult.error) {
    return { error: `Causa guardada pero hubo un error al guardar las partes: ${partesResult.error.message}` };
  }

  revalidatePath("/", "layout"); // refresca lista + contadores del sidebar
  return { savedId, message: id ? "Causa actualizada." : "Causa creada." };
}

export async function deleteCausa(id: string): Promise<FormState> {
  if (!await requireUser()) return { error: "No autenticado." };

  const { data, error } = await deleteCausaService(id);

  if (error) return { error: `No se pudo eliminar la causa: ${error.message}` };
  if (!data || data.length === 0) return { error: "Solo el titular puede eliminar la causa." };

  revalidatePath("/", "layout");
  return { message: "Causa eliminada." };
}
