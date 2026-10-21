"use client";

import { useState, useTransition } from "react";
import { TextField, SelectField } from "@/components/ui/FormControls";
import { guardarMonedaJudicial } from "@/app/(app)/ajustes/actions";
import { useMonedasJudiciales } from "@/store/monedasJudicialesStore";
import type { MonedaJudicial } from "@/types";

const PRESETS: Record<string, { nombre: string; referencia: string }> = {
  JUS: { nombre: "JUS", referencia: "Córdoba" },
  UMA: { nombre: "UMA", referencia: "Buenos Aires" },
};

function parseValor(texto: string): number {
  return Number(texto.trim().replace(/\./g, "").replace(",", "."));
}

// Alta o edición de una moneda judicial. Guarda en el store compartido.
export default function FormularioMoneda({
  inicial = null,
  onHecho,
  onCancelar,
}: {
  inicial?: MonedaJudicial | null;
  onHecho: (m: MonedaJudicial) => void;
  onCancelar?: () => void;
}) {
  const monedas = useMonedasJudiciales((s) => s.monedas);
  const setMonedas = useMonedasJudiciales((s) => s.setMonedas);
  const [tipo, setTipo] = useState(inicial ? (PRESETS[inicial.nombre] ? inicial.nombre : "Otro") : "JUS");
  const [nombre, setNombre] = useState(inicial?.nombre ?? PRESETS.JUS.nombre);
  const [referencia, setReferencia] = useState(inicial ? (inicial.referencia ?? "") : PRESETS.JUS.referencia);
  const [valor, setValor] = useState(inicial ? String(inicial.valor) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  const guardar = () => {
    const n = parseValor(valor);
    if (!nombre.trim()) return setError("Ingresá el nombre de la moneda.");
    if (!Number.isFinite(n) || n <= 0) return setError("Ingresá un valor en pesos mayor a cero.");
    setError(null);
    startTransition(async () => {
      const r = await guardarMonedaJudicial({ id: inicial?.id, nombre, referencia, valor: n });
      if (r.error || !r.moneda) return setError(r.error ?? "No se pudo guardar.");
      setMonedas([...monedas.filter((m) => m.id !== r.moneda!.id), r.moneda].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      onHecho(r.moneda);
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <SelectField label="Tipo" value={tipo} onChange={(e) => elegirTipo(e.target.value)} options={["JUS", "UMA", "Otro"]} />
      {tipo === "Otro" && (
        <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: UMA Mendoza" maxLength={30} />
      )}
      <TextField label="Referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej.: Córdoba" maxLength={60} />
      <TextField label="Valor en pesos" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="51345,90" />
      {error && <p className="text-[12.5px] text-red">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="cursor-pointer rounded-[6px] px-3 py-[6px] text-[13px] text-sub hover:text-text">Cancelar</button>
        )}
        <button type="button" onClick={guardar} disabled={pending}
          className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50">
          {pending ? "Guardando…" : inicial ? "Guardar cambios" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
