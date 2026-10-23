// Tipos y cálculos de liquidaciones y órdenes de pago (sin dependencias de React ni de la base).

export interface RubroLiquidacion {
  nombre: string;
  monto: number;
}

export interface Liquidacion {
  id: string;
  causa_id: string;
  fecha: string;
  descripcion: string | null;
  rubros: RubroLiquidacion[];
  aprobada: boolean;
  fecha_aprobacion: string | null;
}

export interface Imputacion {
  rubro: string;
  monto: number;
}

export type EstadoOP = "Librada" | "Procesada";

export interface OrdenPago {
  id: string;
  causa_id: string;
  numero: string;
  fecha: string;
  monto: number;
  beneficiario: string | null;
  estado: EstadoOP;
  imputaciones: Imputacion[];
}

export type EstadoRubro = "En curso" | "Cerca de cancelarse" | "Cancelado" | "Sin monto";

export interface FilaSeguimiento {
  rubro: string;
  liquidado: number;
  girado: number;     // imputado en todas las OP de la causa (librada o procesada)
  procesado: number;  // imputado en OP ya procesadas
  pendiente: number;
  pct: number;
  estado: EstadoRubro;
}

// Umbral a partir del cual un rubro se considera "cerca de cancelarse"
export const UMBRAL_CERCA = 90;

// Compara nombres de rubro sin distinguir mayúsculas, acentos ni espacios sobrantes
export function claveRubro(nombre: string): string {
  return nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

// La última liquidación aprobada (por fecha de aprobación; si empatan, por fecha de la planilla)
export function ultimaAprobada(liquidaciones: Liquidacion[]): Liquidacion | null {
  const aprobadas = liquidaciones.filter((l) => l.aprobada);
  if (aprobadas.length === 0) return null;
  return [...aprobadas].sort((a, b) =>
    (b.fecha_aprobacion ?? "").localeCompare(a.fecha_aprobacion ?? "") || b.fecha.localeCompare(a.fecha),
  )[0];
}

export function totalLiquidacion(liquidacion: Liquidacion): number {
  return liquidacion.rubros.reduce((acc, r) => acc + r.monto, 0);
}

// Cuánto se imputó a cada rubro de la liquidación, y cuánto falta para cancelarlo
export function seguimiento(liquidacion: Liquidacion, ordenes: OrdenPago[]): FilaSeguimiento[] {
  return liquidacion.rubros.map((rubro) => {
    const clave = claveRubro(rubro.nombre);
    let girado = 0;
    let procesado = 0;
    for (const op of ordenes) {
      for (const imp of op.imputaciones) {
        if (claveRubro(imp.rubro) !== clave) continue;
        girado += imp.monto;
        if (op.estado === "Procesada") procesado += imp.monto;
      }
    }
    const pct = rubro.monto > 0 ? Math.min(100, (girado / rubro.monto) * 100) : 0;
    const estado: EstadoRubro =
      rubro.monto <= 0 ? "Sin monto" : pct >= 100 ? "Cancelado" : pct >= UMBRAL_CERCA ? "Cerca de cancelarse" : "En curso";
    return {
      rubro: rubro.nombre,
      liquidado: rubro.monto,
      girado,
      procesado,
      pendiente: Math.max(0, rubro.monto - girado),
      pct,
      estado,
    };
  });
}

// Rubros sugeridos para empezar (el usuario puede escribir otros)
export const RUBROS_SUGERIDOS = ["Capital", "Intereses", "Costas", "Honorarios", "Tasa de justicia", "Aportes", "Otros"];
