"use client";

import { useEffect, useState } from "react";
import { useMonedasJudiciales } from "@/store/monedasJudicialesStore";
import { listarMonedasJudiciales } from "@/app/(app)/ajustes/actions";
import { saveHonorario } from "@/app/(app)/causas/detailActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";
import { CONCEPTOS_HONORARIO } from "@/utils/honorarios";
import type { Honorario } from "@/types";

interface HonorarioFormProps {
  causaId: string;
  honorario: Honorario | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const CONCEPTOS_CON_OTRO: readonly string[] = CONCEPTOS_HONORARIO;

function Opcion({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border px-4 py-[6px] text-[13px] font-semibold transition-colors ${
        activo ? "border-blue bg-blue text-on-primary" : "border-border bg-bg text-sub hover:border-blue"
      }`}
    >
      {children}
    </button>
  );
}

export default function HonorarioForm({ causaId, honorario, onClose, onSaved }: HonorarioFormProps) {
  const { state, pending, onSubmit } = useFormAction(saveHonorario, (s) => onSaved(s.message ?? "Guardado."));
  const monedasJud = useMonedasJudiciales((st) => st.monedas);
  const monedasCargado = useMonedasJudiciales((st) => st.cargado);
  const setMonedasJud = useMonedasJudiciales((st) => st.setMonedas);
  useEffect(() => {
    if (!monedasCargado) listarMonedasJudiciales().then(setMonedasJud);
  }, [monedasCargado, setMonedasJud]);

  // Clave de la moneda elegida: "ARS", "USD", "J:<id>" (moneda judicial del usuario) o "J:anterior" (ya no existe).
  const nombreJudicialPrevio = honorario?.moneda === "JUS" ? (honorario.moneda_judicial_nombre ?? "JUS") : null;
  const [monedaKey, setMonedaKey] = useState<string>(() => {
    if (honorario) {
      if (honorario.moneda === "USD") return "USD";
      if (honorario.moneda === "JUS") return "J:anterior";
      return "ARS";
    }
    return "ARS";
  });
  const judicialElegida = monedaKey.startsWith("J:") && monedaKey !== "J:anterior"
    ? monedasJud.find((m) => `J:${m.id}` === monedaKey) ?? null
    : null;
  const etiquetaMonedaElegida = monedaKey === "ARS" || monedaKey === "USD"
    ? monedaKey
    : judicialElegida?.nombre ?? nombreJudicialPrevio ?? "JUS";
  const matchJud = nombreJudicialPrevio ? monedasJud.find((m) => m.nombre === nombreJudicialPrevio) : undefined;
  const claveActiva = monedaKey === "J:anterior" && matchJud ? `J:${matchJud.id}` : monedaKey;
  const opcionesMoneda = [
    { key: "ARS", label: "ARS" },
    { key: "USD", label: "USD" },
    ...monedasJud.map((m) => ({ key: `J:${m.id}`, label: m.nombre })),
    ...(monedaKey === "J:anterior" && !matchJud ? [{ key: "J:anterior", label: nombreJudicialPrevio ?? "JUS" }] : []),
  ];
  const conceptoInicial = honorario && CONCEPTOS_CON_OTRO.includes(honorario.concepto) ? honorario.concepto : honorario ? "Otro" : "Consulta";
  const [concepto, setConcepto] = useState(conceptoInicial);
  const [periodicidad, setPeriodicidad] = useState<"unico" | "mensual">(honorario?.periodicidad ?? "unico");
  const [cuotasFijas, setCuotasFijas] = useState(Boolean(honorario?.cuotas_mensuales));

  return (
    <Modal
      open
      title={honorario ? "Editar honorario" : "Nuevo honorario"}
      onClose={onClose}
      footer={<ModalFooter formId="honorario-form" pending={pending} submitLabel="Guardar" onCancel={onClose} />}
    >
      <form id="honorario-form" onSubmit={onSubmit}>
        <input type="hidden" name="causa_id" value={causaId} />
        {honorario && <input type="hidden" name="id" value={honorario.id} />}
        <input type="hidden" name="moneda" value={monedaKey === "ARS" || monedaKey === "USD" ? monedaKey : "JUS"} />
        <input type="hidden" name="moneda_judicial" value={judicialElegida?.id ?? ""} />
        <input type="hidden" name="periodicidad" value={periodicidad} />
        {state.error && (
          <div className="px-4 pt-3">
            <FormAlert state={state} />
          </div>
        )}

        <FormSection title="Concepto">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-sub">Tipo de honorario</label>
            <div className="flex flex-wrap gap-2">
              {CONCEPTOS_HONORARIO.map((c) => (
                <Opcion key={c} activo={concepto === c} onClick={() => setConcepto(c)}>
                  {c}
                </Opcion>
              ))}
            </div>
            <input type="hidden" name="concepto" value={concepto} />
          </div>
          {concepto === "Otro" && (
            <TextField
              label="Nombre del concepto"
              name="concepto_otro"
              required
              maxLength={80}
              defaultValue={honorario && !CONCEPTOS_CON_OTRO.includes(honorario.concepto) ? honorario.concepto : ""}
              placeholder="Ej: Mediación, Peritaje"
            />
          )}
        </FormSection>

        <FormSection title="Acuerdo">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-sub">Moneda</label>
            <div className="flex gap-2">
              {opcionesMoneda.map((o) => (
                <Opcion key={o.key} activo={claveActiva === o.key} onClick={() => setMonedaKey(o.key)}>
                  {o.label}
                </Opcion>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-sub">Periodicidad</label>
            <div className="flex gap-2">
              <Opcion activo={periodicidad === "unico"} onClick={() => setPeriodicidad("unico")}>
                Pago único / total
              </Opcion>
              <Opcion activo={periodicidad === "mensual"} onClick={() => setPeriodicidad("mensual")}>
                Mensual
              </Opcion>
            </div>
          </div>

          {periodicidad === "mensual" && (
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-sub">Cantidad de cuotas</label>
              <div className="flex flex-wrap gap-2">
                <Opcion activo={!cuotasFijas} onClick={() => setCuotasFijas(false)}>
                  Indefinido
                </Opcion>
                <Opcion activo={cuotasFijas} onClick={() => setCuotasFijas(true)}>
                  Cantidad fija
                </Opcion>
              </div>
              {cuotasFijas && (
                <div className="mt-2">
                  <TextField
                    label="Número de cuotas"
                    name="cuotas_mensuales"
                    inputMode="numeric"
                    required
                    defaultValue={honorario?.cuotas_mensuales ?? ""}
                    placeholder="Ej: 6"
                  />
                </div>
              )}
            </div>
          )}

          <TextField
            label={periodicidad === "mensual" ? `Monto mensual (${etiquetaMonedaElegida})` : `Monto acordado (${etiquetaMonedaElegida})`}
            name="monto_acordado"
            inputMode="decimal"
            required
            autoFocus
            defaultValue={honorario?.monto_acordado ?? ""}
            placeholder={monedaKey === "ARS" ? "840000" : monedaKey === "USD" ? "5000" : "1000"}
          />
          {monedaKey === "J:anterior" && (
            <p className="sm:col-span-2 text-[12px] text-muted">
              Esta moneda ya no está en tus monedas judiciales: se conserva la cotización con la que se cargó.
            </p>
          )}
          {monedasCargado && monedasJud.length === 0 && monedaKey !== "J:anterior" && (
            <p className="sm:col-span-2 rounded-[6px] border border-amb-bd bg-amb-lt px-3 py-2 text-[12px] text-amb">
              Para cargar honorarios en una moneda judicial (JUS, UMA u otra), primero agregala en Moneda judicial, en la parte superior del dashboard.
            </p>
          )}
          {periodicidad === "unico" && (
            <TextField
              label="Porcentaje (%)"
              name="porcentaje"
              inputMode="decimal"
              defaultValue={honorario?.porcentaje ?? ""}
              placeholder="Opcional"
            />
          )}
          <TextField
            label={`Monto adicional fijo (${etiquetaMonedaElegida})`}
            name="monto_adicional"
            inputMode="decimal"
            defaultValue={honorario?.monto_adicional ?? ""}
            placeholder="Opcional"
          />
          <TextField label="Fecha del pacto" name="fecha_pacto" type="date" defaultValue={honorario?.fecha_pacto ?? ""} />
        </FormSection>

        <FormSection title="Notas / condiciones">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-sub">Notas sobre cuotas o condiciones</label>
            <textarea
              name="notas_honorarios"
              rows={3}
              maxLength={1000}
              defaultValue={honorario?.notas_honorarios ?? ""}
              placeholder="Ej: 3 cuotas iguales, la primera al inicio del juicio…"
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue focus:ring-1 focus:ring-blue resize-none"
            />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
