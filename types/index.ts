import type {
  ANTICIPACION_ALERTA,
  ESTADOS_CAUSA,
  TIPOS_CAUSA,
  TIPOS_MOVIMIENTO,
  TIPOS_VENCIMIENTO,
} from "@/utils/constants";

export type TipoCausa = (typeof TIPOS_CAUSA)[number];
export type EstadoCausa = (typeof ESTADOS_CAUSA)[number];
export type Anticipacion = (typeof ANTICIPACION_ALERTA)[number];
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];
export type TipoVencimiento = (typeof TIPOS_VENCIMIENTO)[number];
export type EstadoAlerta = "Pendiente" | "Notificado" | "Vencido";

// Fechas: DATE llega como "YYYY-MM-DD", TIMESTAMPTZ como ISO string.
// DECIMAL llega como number.

export interface Profile {
  id: string;
  email: string;
  nombre_completo: string | null;
  empresa: string | null;
  plan: "free" | "pro";
  estado_pago: "activo" | "vencido" | "prueba";
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
  tipo_causa: TipoCausa | null;
  fuero: string | null;
  juzgado_camara: string | null;
  parte_actora: string | null;
  parte_demandada: string | null;
  cliente_id: string | null;
  estado: EstadoCausa;
  fecha_inicio: string | null;
  proximo_vencimiento: string | null;
  tipo_vencimiento: string | null;
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

export interface CausaShare {
  id: string;
  causa_id: string;
  shared_with_user_id: string;
  invited_by_user_id: string;
  created_at: string;
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
