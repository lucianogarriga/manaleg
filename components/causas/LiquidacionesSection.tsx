"use client";

import React, { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import Modal from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/FormControls";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { formatCurrency, formatDate, todayISO } from "@/utils/formatters";
import {
  RUBROS_SUGERIDOS,
  claveRubro,
  seguimiento,
  totalLiquidacion,
  ultimaAprobada,
  type EstadoRubro,
  type Liquidacion,
  type OrdenPago,
} from "@/utils/liquidaciones";
import {
  eliminarLiquidacion,
  eliminarOrdenPago,
  guardarLiquidacion,
  guardarOrdenPago,
} from "@/app/(app)/causas/liquidacionActions";

interface Props {
  causaId: string;
  esTitular: boolean;
  liquidaciones: Liquidacion[];
  ordenes: OrdenPago[];
}

// Acepta "1.234.567,89" y "1234567.89"
const numero = (s: string): number => {
  const t = s.trim();
  if (!t) return 0;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(normal);
  return Number.isFinite(n) ? n : 0;
};
const pesos = (n: number) => formatCurrency(n, "ARS");
const aCampo = (n: number) => String(n).replace(".", ",");

const COLOR_ESTADO: Record<EstadoRubro, string> = {
  "En curso": "text-muted",
  "Cerca de cancelarse": "text-amb",
  Cancelado: "text-blue",
  "Sin monto": "text-muted",
};

// ─── Seguimiento: tres formas de ver lo mismo ────────────────────────────────
type Vista = "linea" | "tablero" | "matriz";
const VISTAS: { id: Vista; label: string }[] = [
  { id: "linea", label: "Línea de tiempo" },
  { id: "tablero", label: "Tablero" },
  { id: "matriz", label: "Matriz" },
];

// OP en orden cronológico (la más antigua primero)
const cronologicas = (ordenes: OrdenPago[]) =>
  [...ordenes].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.numero.localeCompare(b.numero));

function VistaLinea({ aprobada, ordenes }: { aprobada: Liquidacion; ordenes: OrdenPago[] }) {
  let saldo = totalLiquidacion(aprobada);
  return (
    <div className="relative flex flex-col gap-4 pl-6">
      <span aria-hidden className="absolute bottom-2 left-[6px] top-2 w-[2px] bg-border" />
      <div className="relative">
        <span aria-hidden className="absolute -left-6 top-[5px] h-[12px] w-[12px] rounded-full bg-blue" />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold text-text">Liquidación aprobada</span>
          <span className="text-[12px] tabular-nums text-muted">{formatDate(aprobada.fecha_aprobacion ?? aprobada.fecha)}</span>
        </div>
        <div className="text-[12.5px] tabular-nums text-sub">Total {pesos(saldo)} · saldo inicial {pesos(saldo)}</div>
      </div>
      {cronologicas(ordenes).map((op) => {
        const imputadoOP = op.imputaciones
          .filter((imp) => aprobada.rubros.some((r) => claveRubro(r.nombre) === claveRubro(imp.rubro)))
          .reduce((acc, imp) => acc + imp.monto, 0);
        saldo = Math.max(0, saldo - imputadoOP);
        return (
          <div key={op.id} className="relative">
            <span aria-hidden className={`absolute -left-6 top-[5px] h-[12px] w-[12px] rounded-full border-2 border-blue ${op.estado === "Procesada" ? "bg-blue" : "bg-card"}`} />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold text-text">OP {op.numero}{op.beneficiario ? ` · ${op.beneficiario}` : ""}</span>
              <span className="text-[12px] tabular-nums text-muted">{formatDate(op.fecha)} · {op.estado}</span>
            </div>
            <div className="text-[12.5px] tabular-nums text-sub">
              {op.imputaciones.length > 0 ? op.imputaciones.map((imp) => `${imp.rubro} ${pesos(imp.monto)}`).join(" · ") : "Sin imputar"}
            </div>
            <div className="text-[12.5px] tabular-nums text-text">Saldo después: <strong>{pesos(saldo)}</strong></div>
          </div>
        );
      })}
    </div>
  );
}

// Donut de avance por rubro: 2 columnas en mobile, 4 en pantallas medianas y 6 en grandes
function Dona({ pct, warn }: { pct: number; warn: boolean }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90" aria-hidden>
        <circle cx="34" cy="34" r={r} fill="none" strokeWidth="6" className="stroke-border" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={warn ? "stroke-amb" : "stroke-blue"}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold tabular-nums text-text">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function VistaTablero({ aprobada, ordenes }: { aprobada: Liquidacion; ordenes: OrdenPago[] }) {
  const filas = seguimiento(aprobada, ordenes);
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
      {filas.map((f) => (
        <div key={f.rubro} className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card p-3 text-center">
          <Dona pct={f.pct} warn={f.estado === "Cerca de cancelarse"} />
          <span className="text-[12.5px] font-semibold text-text">{f.rubro}</span>
          <span className={`text-[11px] font-semibold ${COLOR_ESTADO[f.estado]}`}>{f.estado}</span>
          <span className="text-[11.5px] tabular-nums text-muted">Pendiente {pesos(f.pendiente)}</span>
        </div>
      ))}
    </div>
  );
}

function VistaMatriz({ aprobada, ordenes }: { aprobada: Liquidacion; ordenes: OrdenPago[] }) {
  const rubros = aprobada.rubros.map((r) => r.nombre);
  const filas = seguimiento(aprobada, ordenes);
  const girado = filas.reduce((acc, f) => acc + f.girado, 0);
  const celda = (monto: number) =>
    monto > 0
      ? <td className="px-2 py-[7px] text-right tabular-nums text-text">{pesos(monto)}</td>
      : <td className="px-2 py-[7px] text-right text-muted">—</td>;
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border">
      <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-left text-[11.5px] font-semibold text-muted">
            <th className="px-2 py-[7px] font-semibold">OP</th>
            {rubros.map((r) => <th key={r} className="px-2 py-[7px] text-right font-semibold">{r}</th>)}
            <th className="px-2 py-[7px] text-right font-semibold">Total OP</th>
          </tr>
        </thead>
        <tbody>
          {cronologicas(ordenes).map((op) => (
            <tr key={op.id} className="border-b border-border">
              <td className="whitespace-nowrap px-2 py-[7px] text-text">{op.numero} <span className="text-muted">· {formatDate(op.fecha)}</span></td>
              {rubros.map((r) => {
                const monto = op.imputaciones.filter((i) => claveRubro(i.rubro) === claveRubro(r)).reduce((acc, i) => acc + i.monto, 0);
                return <React.Fragment key={r}>{celda(monto)}</React.Fragment>;
              })}
              <td className="px-2 py-[7px] text-right font-semibold tabular-nums text-text">{pesos(op.monto)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-b border-border font-semibold text-text">
            <td className="px-2 py-[7px]">Girado</td>
            {filas.map((f) => <td key={f.rubro} className="px-2 py-[7px] text-right tabular-nums">{pesos(f.girado)}</td>)}
            <td className="px-2 py-[7px] text-right tabular-nums">{pesos(girado)}</td>
          </tr>
          <tr className="font-semibold text-text">
            <td className="px-2 py-[7px]">Pendiente</td>
            {filas.map((f) => <td key={f.rubro} className="px-2 py-[7px] text-right tabular-nums">{pesos(f.pendiente)}</td>)}
            <td className="px-2 py-[7px] text-right tabular-nums">{pesos(totalLiquidacion(aprobada) - girado)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Seguimiento({ liquidaciones, ordenes, vista }: { liquidaciones: Liquidacion[]; ordenes: OrdenPago[]; vista: Vista }) {
  const aprobada = ultimaAprobada(liquidaciones);
  if (!aprobada) {
    return <p className="text-[13px] text-muted">Aprobá una liquidación para ver cómo se va cancelando cada rubro.</p>;
  }
  const cabecera = (
    <p className="text-[12px] text-muted">
      Liquidación aprobada el {formatDate(aprobada.fecha_aprobacion ?? aprobada.fecha)} · Total {pesos(totalLiquidacion(aprobada))}
    </p>
  );
  if (vista === "tablero") return <div className="flex flex-col gap-3">{cabecera}<VistaTablero aprobada={aprobada} ordenes={ordenes} /></div>;
  if (vista === "matriz") return <div className="flex flex-col gap-3">{cabecera}<VistaMatriz aprobada={aprobada} ordenes={ordenes} /></div>;
  return <div className="flex flex-col gap-3">{cabecera}<VistaLinea aprobada={aprobada} ordenes={ordenes} /></div>;
}

// ─── Formulario de liquidación ───────────────────────────────────────────────
interface FilaRubro { nombre: string; monto: string }

function FormLiquidacion({ causaId, inicial, onGuardado }: {
  causaId: string;
  inicial: Liquidacion | null;
  onGuardado: (mensaje: string) => void;
}) {
  const [fecha, setFecha] = useState(inicial?.fecha ?? todayISO());
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [aprobada, setAprobada] = useState(inicial?.aprobada ?? false);
  const [fechaAprobacion, setFechaAprobacion] = useState(inicial?.fecha_aprobacion ?? todayISO());
  const [rubros, setRubros] = useState<FilaRubro[]>(
    inicial && inicial.rubros.length > 0
      ? inicial.rubros.map((r) => ({ nombre: r.nombre, monto: aCampo(r.monto) }))
      : [{ nombre: "Capital", monto: "" }],
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const total = rubros.reduce((acc, r) => acc + numero(r.monto), 0);

  const actualizar = (i: number, cambio: Partial<FilaRubro>) =>
    setRubros((rs) => rs.map((r, k) => (k === i ? { ...r, ...cambio } : r)));

  const guardar = () => {
    setError(undefined);
    startTransition(async () => {
      const r = await guardarLiquidacion({
        id: inicial?.id,
        causaId,
        fecha,
        descripcion,
        aprobada,
        fechaAprobacion,
        rubros: rubros.map((f) => ({ nombre: f.nombre, monto: numero(f.monto) })),
      });
      if (r.error) return setError(r.error);
      onGuardado(r.message ?? "Liquidación guardada.");
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Fecha de la planilla" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <TextField label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej.: Planilla 1" />
      </div>

      <label className="flex items-center gap-2 text-[13px] text-text">
        <input type="checkbox" checked={aprobada} onChange={(e) => setAprobada(e.target.checked)} className="h-[14px] w-[14px] accent-blue" />
        Liquidación aprobada
      </label>
      {aprobada && (
        <div className="max-w-[260px]">
          <TextField label="Fecha de aprobación" type="date" value={fechaAprobacion} onChange={(e) => setFechaAprobacion(e.target.value)} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[.4px] text-muted">Rubros</span>
        <datalist id="rubros-sugeridos">
          {RUBROS_SUGERIDOS.map((r) => <option key={r} value={r} />)}
        </datalist>
        {rubros.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <TextField label="Rubro" list="rubros-sugeridos" value={r.nombre} onChange={(e) => actualizar(i, { nombre: e.target.value })} />
            <TextField label="Monto ($)" inputMode="decimal" value={r.monto} onChange={(e) => actualizar(i, { monto: e.target.value })} placeholder="0,00" />
            <button
              type="button"
              aria-label="Quitar rubro"
              onClick={() => setRubros((rs) => rs.filter((_, k) => k !== i))}
              disabled={rubros.length === 1}
              className="mb-[2px] flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[6px] text-muted hover:text-red disabled:opacity-30"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRubros((rs) => [...rs, { nombre: "", monto: "" }])}
          className="self-start cursor-pointer text-[12.5px] font-semibold text-blue hover:underline"
        >
          + Agregar rubro
        </button>
        <p className="text-[12.5px] tabular-nums text-sub">Total de la planilla: <strong className="text-text">{pesos(total)}</strong></p>
      </div>

      {error && <p className="text-[12.5px] text-red">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-border pt-3">
        <button type="button" onClick={guardar} disabled={pending}
          className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[13.5px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar liquidación"}
        </button>
      </div>
    </div>
  );
}

// ─── Formulario de orden de pago ─────────────────────────────────────────────
interface FilaImputacion { rubro: string; monto: string }

function FormOrdenPago({ causaId, inicial, rubrosAprobados, onGuardado }: {
  causaId: string;
  inicial: OrdenPago | null;
  rubrosAprobados: string[];
  onGuardado: (mensaje: string) => void;
}) {
  const [numeroOp, setNumeroOp] = useState(inicial?.numero ?? "");
  const [fecha, setFecha] = useState(inicial?.fecha ?? todayISO());
  const [beneficiario, setBeneficiario] = useState(inicial?.beneficiario ?? "");
  const [monto, setMonto] = useState(inicial ? aCampo(inicial.monto) : "");
  const [estado, setEstado] = useState<string>(inicial?.estado ?? "Librada");
  const [imputaciones, setImputaciones] = useState<FilaImputacion[]>(
    inicial ? inicial.imputaciones.map((i) => ({ rubro: i.rubro, monto: aCampo(i.monto) })) : [],
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const montoOp = numero(monto);
  const imputado = imputaciones.reduce((acc, i) => acc + numero(i.monto), 0);
  const sinImputar = montoOp - imputado;
  const opciones = Array.from(new Set([...rubrosAprobados, ...RUBROS_SUGERIDOS]));

  const actualizar = (i: number, cambio: Partial<FilaImputacion>) =>
    setImputaciones((xs) => xs.map((x, k) => (k === i ? { ...x, ...cambio } : x)));

  const guardar = () => {
    setError(undefined);
    startTransition(async () => {
      const r = await guardarOrdenPago({
        id: inicial?.id,
        causaId,
        numero: numeroOp,
        fecha,
        monto: montoOp,
        beneficiario,
        estado: estado as OrdenPago["estado"],
        imputaciones: imputaciones.map((i) => ({ rubro: i.rubro, monto: numero(i.monto) })),
      });
      if (r.error) return setError(r.error);
      onGuardado(r.message ?? "Orden de pago guardada.");
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Número de OP" value={numeroOp} onChange={(e) => setNumeroOp(e.target.value)} placeholder="Ej.: 1234/2026" />
        <TextField label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <TextField label="Monto ($)" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0,00" />
        <SelectField label="Estado" options={["Librada", "Procesada"]} value={estado} onChange={(e) => setEstado(e.target.value)} />
        <div className="sm:col-span-2">
          <TextField label="Beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} placeholder="Ej.: Actor, perito, letrado" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[.4px] text-muted">Imputación a rubros</span>
        <datalist id="rubros-op">
          {opciones.map((r) => <option key={r} value={r} />)}
        </datalist>
        {imputaciones.map((imp, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <TextField label="Rubro" list="rubros-op" value={imp.rubro} onChange={(e) => actualizar(i, { rubro: e.target.value })} />
            <TextField label="Imputado ($)" inputMode="decimal" value={imp.monto} onChange={(e) => actualizar(i, { monto: e.target.value })} placeholder="0,00" />
            <button
              type="button"
              aria-label="Quitar imputación"
              onClick={() => setImputaciones((xs) => xs.filter((_, k) => k !== i))}
              className="mb-[2px] flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[6px] text-muted hover:text-red"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setImputaciones((xs) => [...xs, { rubro: "", monto: "" }])}
          className="self-start cursor-pointer text-[12.5px] font-semibold text-blue hover:underline"
        >
          + Imputar a un rubro
        </button>
        {montoOp > 0 && (
          <p className={`text-[12.5px] tabular-nums ${sinImputar < 0 ? "text-red" : "text-sub"}`}>
            {sinImputar < 0
              ? `Imputaste ${pesos(-sinImputar)} de más.`
              : `Sin imputar: ${pesos(sinImputar)}`}
          </p>
        )}
      </div>

      {error && <p className="text-[12.5px] text-red">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-border pt-3">
        <button type="button" onClick={guardar} disabled={pending}
          className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[13.5px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar orden de pago"}
        </button>
      </div>
    </div>
  );
}

// ─── Sección completa ────────────────────────────────────────────────────────
export default function LiquidacionesSection({ causaId, esTitular, liquidaciones, ordenes }: Props) {
  const [formLiq, setFormLiq] = useState<{ liq: Liquidacion | null } | null>(null);
  const [formOp, setFormOp] = useState<{ op: OrdenPago | null } | null>(null);
  const [aviso, setAviso] = useState<string>();
  const [vista, setVista] = useState<Vista>("linea");
  const [, startDelete] = useTransition();
  const { request: confirmar, dialog } = useConfirm();

  const aprobada = ultimaAprobada(liquidaciones);
  const rubrosAprobados = aprobada ? aprobada.rubros.map((r) => r.nombre) : [];

  const borrarLiq = async (l: Liquidacion) => {
    const ok = await confirmar({ title: "Eliminar liquidación", message: "¿Eliminar esta liquidación? Las órdenes de pago que ya imputaste no se borran.", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    startDelete(async () => {
      const r = await eliminarLiquidacion(l.id, causaId);
      setAviso(r.error ?? r.message);
    });
  };

  const borrarOp = async (op: OrdenPago) => {
    const ok = await confirmar({ title: "Eliminar orden de pago", message: `¿Eliminar la OP ${op.numero}?`, confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    startDelete(async () => {
      const r = await eliminarOrdenPago(op.id, causaId);
      setAviso(r.error ?? r.message);
    });
  };

  const tituloBoton = "cursor-pointer inline-flex items-center gap-1 rounded-[6px] border border-border bg-card px-2.5 py-[4px] text-[12px] font-semibold text-blue hover:bg-bg";

  return (
    <CollapsibleSection title="Liquidación y órdenes de pago">
      <div className="flex flex-col gap-6 px-4 py-4">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[12px] font-bold uppercase tracking-[.4px] text-sub">Seguimiento de rubros</h3>
            <div role="group" aria-label="Forma de ver el seguimiento" className="inline-flex rounded-full border border-border bg-bg p-[3px]">
              {VISTAS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={vista === v.id}
                  onClick={() => setVista(v.id)}
                  className={`cursor-pointer rounded-full px-3 py-[4px] text-[12px] font-semibold transition-colors ${
                    vista === v.id ? "bg-card text-blue shadow-sm" : "text-muted hover:text-text"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <Seguimiento liquidaciones={liquidaciones} ordenes={ordenes} vista={vista} />
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[12px] font-bold uppercase tracking-[.4px] text-sub">Liquidaciones</h3>
            {esTitular && (
              <button type="button" onClick={() => setFormLiq({ liq: null })} className={tituloBoton}>
                <Plus size={13} /> Nueva liquidación
              </button>
            )}
          </div>
          {liquidaciones.length === 0 && <p className="text-[13px] text-muted">Todavía no cargaste liquidaciones.</p>}
          {liquidaciones.map((l) => (
            <div key={l.id} className="flex flex-col gap-1 rounded-[8px] border border-border bg-card px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-text">
                  {l.descripcion ?? "Planilla"} · {formatDate(l.fecha)}
                </span>
                <span className={`rounded-full px-2 py-[1px] text-[11px] font-semibold ${l.aprobada ? "bg-blue-lt text-blue" : "bg-border text-muted"}`}>
                  {l.aprobada ? `Aprobada ${formatDate(l.fecha_aprobacion)}` : "Borrador"}
                </span>
              </div>
              <div className="text-[12px] tabular-nums text-sub">
                {l.rubros.map((r) => `${r.nombre} ${pesos(r.monto)}`).join(" · ")}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold tabular-nums text-text">Total {pesos(totalLiquidacion(l))}</span>
                {esTitular && (
                  <div className="flex gap-1">
                    <button type="button" aria-label="Editar liquidación" onClick={() => setFormLiq({ liq: l })} className="cursor-pointer rounded p-1 text-muted hover:text-blue"><Pencil size={13} /></button>
                    <button type="button" aria-label="Eliminar liquidación" onClick={() => borrarLiq(l)} className="cursor-pointer rounded p-1 text-muted hover:text-red"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[12px] font-bold uppercase tracking-[.4px] text-sub">Órdenes de pago</h3>
            {esTitular && (
              <button type="button" onClick={() => setFormOp({ op: null })} className={tituloBoton}>
                <Plus size={13} /> Nueva orden de pago
              </button>
            )}
          </div>
          {ordenes.length === 0 && <p className="text-[13px] text-muted">Todavía no cargaste órdenes de pago.</p>}
          {ordenes.map((op) => (
            <div key={op.id} className="flex flex-col gap-1 rounded-[8px] border border-border bg-card px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-text">
                  OP {op.numero} · {formatDate(op.fecha)}{op.beneficiario ? ` · ${op.beneficiario}` : ""}
                </span>
                <span className={`rounded-full px-2 py-[1px] text-[11px] font-semibold ${op.estado === "Procesada" ? "bg-blue-lt text-blue" : "bg-border text-sub"}`}>
                  {op.estado}
                </span>
              </div>
              <div className="text-[12px] tabular-nums text-sub">
                {op.imputaciones.length > 0 ? op.imputaciones.map((i) => `${i.rubro} ${pesos(i.monto)}`).join(" · ") : "Sin imputar"}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold tabular-nums text-text">{pesos(op.monto)}</span>
                {esTitular && (
                  <div className="flex gap-1">
                    <button type="button" aria-label="Editar orden de pago" onClick={() => setFormOp({ op })} className="cursor-pointer rounded p-1 text-muted hover:text-blue"><Pencil size={13} /></button>
                    <button type="button" aria-label="Eliminar orden de pago" onClick={() => borrarOp(op)} className="cursor-pointer rounded p-1 text-muted hover:text-red"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {aviso && <p className="text-[12.5px] text-sub">{aviso}</p>}
      </div>

      {/* Se montan en body: dentro de cards con transform, un modal fijo quedaría mal ubicado */}
      {typeof document !== "undefined" && createPortal(
        <>
          {formLiq && (
            <Modal open title={formLiq.liq ? "Editar liquidación" : "Nueva liquidación"} onClose={() => setFormLiq(null)}>
              <FormLiquidacion
                causaId={causaId}
                inicial={formLiq.liq}
                onGuardado={(m) => { setFormLiq(null); setAviso(m); }}
              />
            </Modal>
          )}
          {formOp && (
            <Modal open title={formOp.op ? "Editar orden de pago" : "Nueva orden de pago"} onClose={() => setFormOp(null)}>
              <FormOrdenPago
                causaId={causaId}
                inicial={formOp.op}
                rubrosAprobados={rubrosAprobados}
                onGuardado={(m) => { setFormOp(null); setAviso(m); }}
              />
            </Modal>
          )}
          {dialog}
        </>,
        document.body,
      )}
    </CollapsibleSection>
  );
}
