"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { saveHonorario } from "@/app/(app)/causas/detailActions";
import FormAlert from "@/components/auth/FormAlert";
import { FormSection, TextField } from "@/components/ui/FormControls";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";
import { useFormAction } from "@/hooks/useFormAction";
import { CONCEPTOS_HONORARIO, MONEDAS_HONORARIO, monedaDeHonorario, type MonedaHonorario } from "@/utils/honorarios";
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
  const [moneda, setMoneda] = useState<MonedaHonorario>(monedaDeHonorario(honorario?.moneda));
  const conceptoInicial = honorario && CONCEPTOS_CON_OTRO.includes(honorario.concepto) ? honorario.concepto : honorario ? "Otro" : "Consulta";
  const [concepto, setConcepto] = useState(conceptoInicial);
  const [periodicidad, setPeriodicidad] = useState<"unico" | "mensual">(honorario?.periodicidad ?? "unico");
  const [cuotasFijas, setCuotasFijas] = useState(Boolean(honorario?.cuotas_mensuales));
  const valorJusPerfil = useAuthStore((s) => s.profile?.jus_valor ?? null);

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
        <input type="hidden" name="moneda" value={moneda} />
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
              {MONEDAS_HONORARIO.map((m) => (
                <Opcion key={m} activo={moneda === m} onClick={() => setMoneda(m)}>
                  {m}
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
            label={periodicidad === "mensual" ? `Monto mensual (${moneda})` : `Monto acordado (${moneda})`}
            name="monto_acordado"
            inputMode="decimal"
            required
            autoFocus
            defaultValue={honorario?.monto_acordado ?? ""}
            placeholder={moneda === "ARS" ? "840000" : moneda === "USD" ? "5000" : "1000"}
          />
          {moneda === "JUS" && (
            <div className="sm:col-span-2">
              <TextField
                label="Cotización del JUS (ARS por JUS)"
                name="cotizacion_ars"
                inputMode="decimal"
                required
                defaultValue={honorario?.cotizacion_ars ?? valorJusPerfil ?? ""}
                placeholder="45000"
              />
              <p className="mt-1 text-[11px] text-muted">Se carga a mano. Los pesos de este honorario suman en los indicadores del dashboard.</p>
            </div>
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
            label={`Monto adicional fijo (${moneda})`}
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
