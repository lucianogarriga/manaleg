"use client";

import { useEffect, useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { TextField, SelectField } from "@/components/ui/FormControls";
import { eliminarMonedaJudicial, guardarMonedaJudicial, listarMonedasJudiciales } from "@/app/(app)/ajustes/actions";
import { useMonedasJudiciales } from "@/store/monedasJudicialesStore";
import { useUIStore } from "@/store/uiStore";
import type { MonedaJudicial } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";

const PRESETS: Record<string, { nombre: string; referencia: string }> = {
  JUS: { nombre: "JUS", referencia: "Córdoba" },
  UMA: { nombre: "UMA", referencia: "Buenos Aires" },
};

function parseValor(texto: string): number {
  return Number(texto.trim().replace(/\./g, "").replace(",", "."));
}

export default function MonedasJudicialesModal({ onClose, editarId = null }: { onClose: () => void; editarId?: string | null }) {
  const monedas = useMonedasJudiciales((s) => s.monedas);
  const cargado = useMonedasJudiciales((s) => s.cargado);
  const setMonedas = useMonedasJudiciales((s) => s.setMonedas);
  const showToast = useUIStore((s) => s.showToast);
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();

  // Si se abre desde el desplegable para editar, el formulario arranca con esa moneda cargada.
  const inicial = editarId ? monedas.find((m) => m.id === editarId) ?? null : null;
  const [editandoId, setEditandoId] = useState<string | null>(inicial?.id ?? null);
  const [tipo, setTipo] = useState(inicial ? (PRESETS[inicial.nombre] ? inicial.nombre : "Otro") : "JUS");
  const [nombre, setNombre] = useState(inicial?.nombre ?? "JUS");
  const [referencia, setReferencia] = useState(inicial ? (inicial.referencia ?? "") : PRESETS.JUS.referencia);
  const [valor, setValor] = useState(inicial ? String(inicial.valor) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cargado) return;
    listarMonedasJudiciales().then(setMonedas);
  }, [cargado, setMonedas]);

  const elegirTipo = (t: string) => {
    setTipo(t);
    if (PRESETS[t]) {
      setNombre(PRESETS[t].nombre);
      setReferencia(PRESETS[t].referencia);
    } else {
      setNombre("");
      setReferencia("");
    }
  };

  const editar = (m: MonedaJudicial) => {
    setEditandoId(m.id);
    setTipo(PRESETS[m.nombre] ? m.nombre : "Otro");
    setNombre(m.nombre);
    setReferencia(m.referencia ?? "");
    setValor(String(m.valor));
    setError(null);
  };

  const limpiar = () => {
    setEditandoId(null);
    elegirTipo("JUS");
    setValor("");
    setError(null);
  };

  const guardar = () => {
    const n = parseValor(valor);
    if (!nombre.trim()) return setError("Ingresá el nombre de la moneda.");
    if (!Number.isFinite(n) || n <= 0) return setError("Ingresá un valor en pesos mayor a cero.");
    setError(null);
    startTransition(async () => {
      const r = await guardarMonedaJudicial({ id: editandoId ?? undefined, nombre, referencia, valor: n });
      if (r.error || !r.moneda) return setError(r.error ?? "No se pudo guardar.");
      const restantes = monedas.filter((m) => m.id !== r.moneda!.id);
      setMonedas([...restantes, r.moneda].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      showToast({ message: `${r.moneda.nombre} guardado.` });
      limpiar();
    });
  };

  const borrar = async (m: MonedaJudicial) => {
    const ok = await confirmRequest({
      title: "Eliminar moneda judicial",
      message: `¿Eliminar ${m.nombre}? Los honorarios ya cargados con esta moneda conservan su cotización.`,
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    const r = await eliminarMonedaJudicial(m.id);
    if (r.error) return showToast({ message: r.error });
    setMonedas(monedas.filter((x) => x.id !== m.id));
    if (editandoId === m.id) limpiar();
  };

  return (
    <Modal
      open
      title="Monedas judiciales"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-[6px] px-3 py-[6px] text-[13px] text-sub hover:text-text">
            Cerrar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-[13px] text-sub">
          Valores de referencia de uso judicial (por ejemplo JUS de Córdoba o UMA de Buenos Aires). Actualizalos a mano cada 30 o 60 días.
        </p>

        {monedas.length > 0 && (
          <ul className="flex flex-col divide-y divide-border rounded-[8px] border border-border">
            {monedas.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-text">{m.nombre} <span className="font-normal text-muted">{m.referencia ? `· ${m.referencia}` : ""}</span></div>
                  <div className="text-[12px] text-muted">{formatCurrency(m.valor, "ARS")} · actualizado {formatDate(m.valor_fecha)}</div>
                </div>
                <button type="button" onClick={() => editar(m)} className="cursor-pointer text-[12px] font-semibold text-blue hover:underline">Editar</button>
                <button type="button" onClick={() => borrar(m)} className="cursor-pointer text-[12px] font-semibold text-muted hover:text-red">Eliminar</button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3 rounded-[8px] border border-border p-3">
          <div className="text-[12px] font-bold uppercase tracking-[.4px] text-sub">{editandoId ? "Editar moneda" : "Agregar moneda"}</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField label="Tipo" value={tipo} onChange={(e) => elegirTipo(e.target.value)} options={["JUS", "UMA", "Otro"]} />
            {tipo === "Otro" && (
              <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: UMA Mendoza" maxLength={30} />
            )}
            <TextField label="Referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej.: Córdoba" maxLength={60} />
            <TextField label="Valor en pesos" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="51345,90" />
          </div>
          {error && <p className="text-[12.5px] text-red">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            {editandoId && (
              <button type="button" onClick={limpiar} className="cursor-pointer rounded-[6px] px-3 py-[6px] text-[13px] text-sub hover:text-text">Cancelar</button>
            )}
            <button type="button" onClick={guardar} disabled={pending}
              className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50">
              {pending ? "Guardando…" : editandoId ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </div>
      </div>
      {confirmDialog}
    </Modal>
  );
}
