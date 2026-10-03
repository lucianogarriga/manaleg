import type {
  ANTICIPACION_ALERTA,
  ESTADOS_CAUSA,
  FUEROS,
  TIPOS_AVISO,
  TIPOS_EVENTO,
  TIPOS_MOVIMIENTO,
  TIPOS_VENCIMIENTO,
  VIAS_PROCESO,
} from "@/utils/constants";

export type Fuero = (typeof FUEROS)[number];
export type ViaProceso = (typeof VIAS_PROCESO)[number];
export type TipoAviso = (typeof TIPOS_AVISO)[number];
export type EstadoCausa = (typeof ESTADOS_CAUSA)[number];
export type Anticipacion = (typeof ANTICIPACION_ALERTA)[number];
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];
export type TipoVencimiento = (typeof TIPOS_VENCIMIENTO)[number];
export type TipoEvento = (typeof TIPOS_EVENTO)[number];
export type EstadoAlerta = "Pendiente" | "Notificado" | "Vencido";

export interface Evento {
  id: string;
  causa_id: string;
  user_id: string;
  titulo: string;
  tipo: TipoEvento;
  fecha: string; // DATE → "YYYY-MM-DD"
  hora: string | null; // TIME → "HH:MM:SS"
  lugar: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

// Fechas: DATE llega como "YYYY-MM-DD", TIMESTAMPTZ como ISO string.
// DECIMAL llega como number.

export interface Profile {
  id: string;
  email: string;
  nombre_completo: string | null;
  empresa: string | null;
  plan: "free" | "pro";
  estado_pago: "activo" | "vencido" | "prueba";
  notificaciones_email: boolean;
  tyc_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  user_id: string;
  nombre_completo: string;
  dni_cuit: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Causa {
  id: string;
  user_id: string;
  caratula: string;
  nro_expediente: string | null;
  fuero: Fuero | null;
  tipo_juicio: string | null;
  juzgado_camara: string | null;
  parte_actora: string | null;
  parte_demandada: string | null;
  cliente_id: string | null;
  estado: EstadoCausa;
  via_proceso: ViaProceso | null;
  fecha_inicio: string | null;
  proximo_vencimiento: string | null;
  tipo_vencimiento: TipoAviso | null;
  motivo_vencimiento: string | null;
  anticipacion_alerta: Anticipacion;
  inactividad_dias: number;
  monto_reclamado: number | null;
  link_drive: string | null;
  notas: string | null;
  fecha_ultimo_movimiento: string | null;
  ultimo_editor_id: string | null;
  created_at: string;
  updated_at: string;
}

type ProfileRef = Pick<Profile, "id" | "nombre_completo" | "email">;

// Causa con los datos relacionados que muestra la UI
export interface CausaConRelaciones extends Causa {
  owner: ProfileRef | null;
  editor: ProfileRef | null;
  cliente: Pick<Cliente, "id" | "nombre_completo"> | null; // null si es de otro owner (RLS)
  causa_shares: Array<{ id: string }> | null; // colaboradores; length > 0 = causa compartida
}

// Campos editables desde el formulario
export type CausaInput = Pick<
  Causa,
  | "caratula"
  | "nro_expediente"
  | "fuero"
  | "tipo_juicio"
  | "juzgado_camara"
  | "parte_actora"
  | "parte_demandada"
  | "cliente_id"
  | "estado"
  | "via_proceso"
  | "fecha_inicio"
  | "proximo_vencimiento"
  | "tipo_vencimiento"
  | "motivo_vencimiento"
  | "anticipacion_alerta"
  | "inactividad_dias"
  | "monto_reclamado"
  | "link_drive"
  | "notas"
>;

export interface MovimientoConAutor extends Movimiento {
  autor: ProfileRef | null;
}

export type PagoConAutor = Pago & { registrado_por: ProfileRef | null };

// Honorario de una causa con sus pagos (más recientes primero)
export interface HonorarioConPagos extends Honorario {
  pagos: PagoConAutor[];
}

export interface DiaInhabil {
  id: string;
  user_id: string | null; // null = feriado nacional del sistema
  fecha: string;
  descripcion: string;
  tipo: "Feriado nacional" | "Feria judicial" | "Día inhábil";
}

export type TipoNotificacion = "causa_editada" | "movimiento" | "honorarios" | "pago" | "compartida";

export interface Notificacion {
  id: string;
  user_id: string;
  actor_id: string | null;
  causa_id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface CausaShare {
  id: string;
  causa_id: string;
  shared_with_user_id: string;
  invited_by_user_id: string;
  created_at: string;
}

// Colaborador con acceso a una causa compartida
export interface CausaShareConUsuario extends CausaShare {
  usuario: ProfileRef | null;
}

export interface Movimiento {
  id: string;
  causa_id: string;
  autor_id: string;
  fecha: string;
  tipo: TipoMovimiento | null;
  descripcion: string;
  created_at: string;
}

export interface Vencimiento {
  id: string;
  causa_id: string;
  creado_por_id: string;
  fecha_vencimiento: string;
  descripcion: string;
  tipo: TipoVencimiento | null;
  estado_alerta: EstadoAlerta;
  anticipacion: Anticipacion;
  created_at: string;
}

export interface Honorario {
  id: string;
  causa_id: string;
  creado_por_id: string;
  monto_acordado: number;
  porcentaje: number | null;
  fecha_pacto: string | null;
  monto_cobrado: number;
  saldo_pendiente: number;
  created_at: string;
  updated_at: string;
}

export interface Pago {
  id: string;
  honorario_id: string;
  causa_id: string;
  registrado_por_id: string;
  fecha_pago: string;
  monto: number;
  descripcion: string | null;
  comprobante_drive: string | null;
  created_at: string;
}

// Estado de los formularios manejados con Server Actions + useActionState
export interface FormState {
  error?: string;
  message?: string;
  // Valores a re-mostrar si hay error (React 19 resetea el form tras el submit)
  values?: Record<string, string>;
}
