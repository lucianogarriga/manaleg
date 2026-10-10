"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteCausa, saveCausa, type CausaFormState } from "@/app/(app)/causas/actions";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import FormAlert from "@/components/auth/FormAlert";
import Modal from "@/components/ui/Modal";
import { Plus, Trash2 } from "lucide-react";
import AutocompleteField from "@/components/ui/AutocompleteField";
import { FormSection, SelectField, TextAreaField, TextField } from "@/components/ui/FormControls";
import { useCausasStore } from "@/store/causasStore";
import { useUIStore } from "@/store/uiStore";
import { ANTICIPACION_ALERTA, ESTADOS_CAUSA, FUEROS, TIPOS_AVISO, TIPOS_JUICIO_POR_FUERO, VIAS_PROCESO } from "@/utils/constants";
import type { ClienteOption } from "@/services/supabase/clientes";
import type { CaracterAbogado, CausaConRelaciones, CausaParte, RolParte, TipoPersona } from "@/types";

interface CausaFormProps {
  causa: CausaConRelaciones | null; // null = nueva causa
  clientes: ClienteOption[];
  userId: string;
}

interface ParteRow {
  nombre: string;
  tipo_persona: TipoPersona;
  rol: RolParte;
  es_nuestra_parte: boolean;
  caracter_abogado: CaracterAbogado | null;
}

const ROL_OPTIONS: { value: RolParte; label: string }[] = [
  { value: "actora", label: "Actora" },
  { value: "demandada", label: "Demandada" },
  { value: "solicitante", label: "Solicitante" },
  { value: "requirente", label: "Requirente" },
  { value: "solicitado", label: "Solicitado" },
  { value: "requerido", label: "Requerido" },
  { value: "tercero", label: "Tercero" },
  { value: "tercerista", label: "Tercerista" },
  { value: "adquirente", label: "Adquirente" },
  { value: "otro", label: "Otro" },
];

const SELECT_CLASS =
  "rounded-[6px] border border-border bg-bg px-2 py-[7px] text-[13px] text-text outline-none focus:border-blue focus:ring-1 focus:ring-blue";
const INPUT_CLASS =
  "flex-1 rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue focus:ring-1 focus:ring-blue";

function initPartes(causa: CausaConRelaciones | null): ParteRow[] {
  const existing = causa?.causa_partes;
  if (existing && existing.length > 0) {
    return [...existing]
      .sort((a, b) => a.orden - b.orden)
      .map((p: CausaParte) => ({
        nombre: p.nombre,
        tipo_persona: p.tipo_persona,
        rol: p.rol,
        es_nuestra_parte: p.es_nuestra_parte,
        caracter_abogado: p.caracter_abogado,
      }));
  }
  return [{ nombre: "", tipo_persona: "fisica", rol: "actora", es_nuestra_parte: false, caracter_abogado: null }];
}

function computeAutoCaratula(partes: ParteRow[], tipoJuicio: string): string | null {
  const actoras = partes.filter((p) => p.rol === "actora" && p.nombre.trim());
  const demandadas = partes.filter((p) => p.rol === "demandada" && p.nombre.trim());

  if (actoras.length > 0 && demandadas.length > 0) {
    const a = actoras.length === 1 ? actoras[0].nombre.trim() : `${actoras[0].nombre.trim()} y otros`;
    const d = demandadas.length === 1 ? demandadas[0].nombre.trim() : `${demandadas[0].nombre.trim()} y otros`;
    const base = `${a} c/ ${d}`;
    return tipoJuicio.trim() ? `${base} s/ ${tipoJuicio.trim()}` : base;
  }

  const tieneActoraODemandada = partes.some((p) => p.rol === "actora" || p.rol === "demandada");
  if (!tieneActoraODemandada) {
    const main = partes.find((p) => (p.rol === "solicitante" || p.rol === "requirente") && p.nombre.trim());
    if (main) return tipoJuicio.trim() ? `${main.nombre.trim()} - ${tipoJuicio.trim()}` : main.nombre.trim();
  }

  return null;
}

// Se monta solo mientras el modal está abierto (ver CausasView),
// así cada apertura arranca con el estado limpio.
export default function CausaForm({ causa, clientes, userId }: CausaFormProps) {
  const closeForm = useCausasStore((s) => s.closeForm);
  const select = useCausasStore((s) => s.select);
  const [state, action, pending] = useActionState<CausaFormState, FormData>(saveCausa, {});
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDelete] = useTransition();
  const [, startSubmit] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSubmit(() => action(formData));
  };

  const isNew = causa === null;
  useEffect(() => {
    if (!state.savedId) return;
    select(state.savedId);
    closeForm();
    useUIStore.getState().showToast({
      message: state.message ?? "Causa guardada.",
      ...(isNew && { actionLabel: "Cargar otra", onAction: useCausasStore.getState().openCreate }),
    });
  }, [state.savedId, state.message, isNew, select, closeForm]);

  const onDelete = async () => {
    if (!causa) return;
    const ok = await confirmRequest({ title: "Eliminar causa", message: `¿Eliminar "${causa.caratula}"? Se borran también sus movimientos, vencimientos y honorarios. No se puede deshacer.`, confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    startDelete(async () => {
      const result = await deleteCausa(causa.id);
      if (result.error) return setDeleteError(result.error);
      select(null);
      closeForm();
      useUIStore.getState().showToast({ message: result.message ?? "Causa eliminada." });
    });
  };

  const v = causa;
  const busy = pending || deleting;

  // ── Partes ──────────────────────────────────────────────────────
  const [partes, setPartes] = useState<ParteRow[]>(() => initPartes(causa));

  const updateParte = (i: number, patch: Partial<ParteRow>) =>
    setPartes((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const addParte = () =>
    setPartes((ps) => [...ps, { nombre: "", tipo_persona: "fisica", rol: "actora", es_nuestra_parte: false, caracter_abogado: null }]);
  const removeParte = (i: number) => setPartes((ps) => ps.filter((_, idx) => idx !== i));

  // ── Carátula auto-generada ───────────────────────────────────────
  const [tipoJuicio, setTipoJuicio] = useState(v?.tipo_juicio ?? "");
  const [caratula, setCaratula] = useState(v?.caratula ?? "");

  // lastAutoRef: último valor auto-generado que pusimos en caratula.
  // Si caratula === lastAutoRef.current (o estaba vacía), seguimos actualizando.
  const lastAutoRef = useRef<string | null>(null);
  const caratulaRef = useRef(v?.caratula ?? "");
  caratulaRef.current = caratula;

  // Inicializar lastAutoRef en el primer render (useRef no acepta factory function)
  const lastAutoInitialized = useRef(false);
  if (!lastAutoInitialized.current) {
    lastAutoInitialized.current = true;
    const initP = initPartes(causa);
    const auto = computeAutoCaratula(initP, causa?.tipo_juicio ?? "");
    const car = causa?.caratula ?? "";
    lastAutoRef.current = auto !== null && (car === "" || car === auto) ? auto : null;
  }

  useEffect(() => {
    const auto = computeAutoCaratula(partes, tipoJuicio);
    if (auto !== null && (caratulaRef.current === lastAutoRef.current || !caratulaRef.current)) {
      setCaratula(auto);
      lastAutoRef.current = auto;
    }
  }, [partes, tipoJuicio]);

  const [selectedFuero, setSelectedFuero] = useState<string>(v?.fuero ?? "");

  return (
    <>
    <Modal
      open
      title={causa ? "Editar causa" : "Nueva causa"}
      onClose={closeForm}
      footer={
        <div className="flex items-center gap-2">
          {causa && causa.user_id === userId && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="cursor-pointer text-[13px] font-semibold text-red hover:underline disabled:opacity-50"
            >
              {deleting ? "Eliminando…" : "Eliminar causa"}
            </button>
          )}
          <button
            type="button"
            onClick={closeForm}
            className="ml-auto cursor-pointer rounded-[6px] border border-border bg-card px-3 py-[6px] text-[14px] font-medium text-sub hover:bg-bg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="causa-form"
            disabled={busy}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Guardando…" : causa ? "Guardar cambios" : "Crear causa"}
          </button>
        </div>
      }
    >
      <form id="causa-form" onSubmit={onSubmit}>
        {causa && <input type="hidden" name="id" value={causa.id} />}

        {(state.error || deleteError) && (
          <div className="px-4 pt-3">
            <FormAlert state={{ error: state.error ?? deleteError }} />
          </div>
        )}

        <FormSection title="Expediente">
          <div className="sm:col-span-2">
            <TextField
              label="Carátula"
              name="caratula"
              required
              value={caratula}
              onChange={(e) => {
                setCaratula(e.target.value);
                lastAutoRef.current = null; // usuario editó manualmente
              }}
              placeholder="Rodríguez M. c/ Transporte El Rápido SA s/ despido"
              autoFocus={!isNew}
            />
          </div>
          <TextField label="Nro expediente" name="nro_expediente" defaultValue={v?.nro_expediente ?? ""} placeholder="2024-0042581" />
          <SelectField label="Estado" name="estado" options={ESTADOS_CAUSA} defaultValue={v?.estado ?? "Iniciada"} />
          <SelectField label="Vía de proceso" name="via_proceso" options={VIAS_PROCESO} placeholder="Seleccionar…" defaultValue={v?.via_proceso ?? ""} />
          <SelectField
            label="Fuero"
            name="fuero"
            options={FUEROS}
            placeholder="Seleccionar…"
            defaultValue={v?.fuero ?? ""}
            onChange={(e) => setSelectedFuero(e.target.value)}
          />
          <AutocompleteField
            label="Tipo de juicio"
            name="tipo_juicio"
            defaultValue={v?.tipo_juicio ?? ""}
            placeholder="Despido, daños y perjuicios…"
            onChangeValue={setTipoJuicio}
            options={
              selectedFuero && TIPOS_JUICIO_POR_FUERO[selectedFuero]
                ? TIPOS_JUICIO_POR_FUERO[selectedFuero]
                : Object.values(TIPOS_JUICIO_POR_FUERO).flat()
            }
          />
          <TextField label="Juzgado / Cámara" name="juzgado_camara" defaultValue={v?.juzgado_camara ?? ""} placeholder="Cámara 6°" />
          <TextField label="Fecha de inicio" name="fecha_inicio" type="date" defaultValue={v?.fecha_inicio ?? ""} />
        </FormSection>

        <FormSection title="Partes">
          {/* Hidden input con el array de partes serializado */}
          <input
            type="hidden"
            name="partes"
            value={JSON.stringify(partes.map((p, i) => ({ ...p, orden: i })))}
          />

          <div className="sm:col-span-2 flex flex-col gap-2">
            {partes.map((parte, i) => (
              <div key={i} className="rounded-[8px] border border-border bg-bg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={parte.nombre}
                    onChange={(e) => updateParte(i, { nombre: e.target.value })}
                    placeholder="Nombre completo"
                    className={INPUT_CLASS}
                    autoFocus={isNew && i === 0}
                  />
                  {partes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParte(i)}
                      className="mt-[1px] flex cursor-pointer items-center justify-center rounded-[5px] p-[6px] text-muted hover:text-red hover:bg-red-lt/40 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={parte.tipo_persona}
                    onChange={(e) => updateParte(i, { tipo_persona: e.target.value as TipoPersona })}
                    className={SELECT_CLASS}
                  >
                    <option value="fisica">Física</option>
                    <option value="juridica">Jurídica</option>
                  </select>
                  <select
                    value={parte.rol}
                    onChange={(e) => updateParte(i, { rol: e.target.value as RolParte })}
                    className={SELECT_CLASS}
                  >
                    {ROL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <label className="flex flex-wrap items-center gap-2 cursor-pointer text-[12.5px] text-text">
                  <input
                    type="checkbox"
                    checked={parte.es_nuestra_parte}
                    onChange={(e) =>
                      updateParte(i, {
                        es_nuestra_parte: e.target.checked,
                        caracter_abogado: e.target.checked ? (parte.caracter_abogado ?? "apoderado") : null,
                      })
                    }
                    className="rounded"
                  />
                  Somos abogados de esta parte
                  {parte.es_nuestra_parte && (
                    <select
                      value={parte.caracter_abogado ?? "apoderado"}
                      onChange={(e) => updateParte(i, { caracter_abogado: e.target.value as CaracterAbogado })}
                      className={SELECT_CLASS}
                    >
                      <option value="apoderado">Apoderado</option>
                      <option value="patrocinante">Patrocinante</option>
                    </select>
                  )}
                </label>
              </div>
            ))}

            <button
              type="button"
              onClick={addParte}
              className="flex w-fit cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-blue hover:underline"
            >
              <Plus size={12} />
              Agregar parte
            </button>
          </div>

          <SelectField
            label="Cliente"
            name="cliente_id"
            placeholder={clientes.length ? "Sin cliente asignado" : "Todavía no cargaste clientes"}
            options={clientes.map((c) => ({ value: c.id, label: c.nombre_completo }))}
            defaultValue={v?.cliente_id ?? ""}
          />
          <TextField
            label="Monto reclamado ($)"
            name="monto_reclamado"
            inputMode="decimal"
            defaultValue={v?.monto_reclamado ?? ""}
            placeholder="4200000"
          />
        </FormSection>

        <FormSection title="Próxima alerta o vencimiento">
          <TextField label="Fecha" name="proximo_vencimiento" type="date" defaultValue={v?.proximo_vencimiento ?? ""} />
          <SelectField label="Tipo" name="tipo_vencimiento" options={TIPOS_AVISO} defaultValue={v?.tipo_vencimiento ?? "Vencimiento"} />
          <div className="sm:col-span-2">
            <TextField label="Motivo" name="motivo_vencimiento" defaultValue={v?.motivo_vencimiento ?? ""} placeholder="Contestación de demanda" />
          </div>
          <SelectField label="Avisarme con anticipación de" name="anticipacion_alerta" options={ANTICIPACION_ALERTA} defaultValue={v?.anticipacion_alerta ?? "1 día"} />
          <TextField label="Alerta de inactividad (días)" name="inactividad_dias" type="number" min={1} defaultValue={v?.inactividad_dias ?? 7} />
        </FormSection>

        <FormSection title="Otros">
          <div className="sm:col-span-2">
            <TextField label="Link carpeta Drive" name="link_drive" type="url" defaultValue={v?.link_drive ?? ""} placeholder="https://drive.google.com/…" />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField label="Notas" name="notas" defaultValue={v?.notas ?? ""} />
          </div>
        </FormSection>
      </form>
    </Modal>
    {confirmDialog}
    </>
  );
}
