"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
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
import type { CausaConRelaciones } from "@/types";

interface CausaFormProps {
  causa: CausaConRelaciones | null; // null = nueva causa
  clientes: ClienteOption[];
  userId: string;
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

  // Submit manual: con <form action> React 19 vacía el form al terminar,
  // y si hubo un error de validación se perdería todo lo cargado.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSubmit(() => action(formData));
  };

  // Al guardar: cerrar el modal, seleccionar la causa y avisar.
  // Si fue un alta, el aviso ofrece cargar otra causa.
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

  // Demandados dinámicos: se serializa como texto separado por "\n" en parte_demandada
  const initDemandados = () => {
    const raw = v?.parte_demandada ?? "";
    const parts = raw.split("\n").filter(Boolean);
    return parts.length > 0 ? parts : [""];
  };
  const [demandados, setDemandados] = useState<string[]>(initDemandados);
  const [selectedFuero, setSelectedFuero] = useState<string>(v?.fuero ?? "");
  const addDemandado = () => setDemandados((d) => [...d, ""]);
  const removeDemandado = (i: number) => setDemandados((d) => d.filter((_, idx) => idx !== i));
  const updateDemandado = (i: number, val: string) =>
    setDemandados((d) => d.map((x, idx) => (idx === i ? val : x)));

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
              defaultValue={v?.caratula}
              placeholder="Rodríguez M. c/ Transporte El Rápido SA s/ despido"
              autoFocus
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
            options={
              selectedFuero && TIPOS_JUICIO_POR_FUERO[selectedFuero]
                ? TIPOS_JUICIO_POR_FUERO[selectedFuero]
                : Object.values(TIPOS_JUICIO_POR_FUERO).flat()
            }
          />
          <TextField label="Juzgado / Cámara" name="juzgado_camara" defaultValue={v?.juzgado_camara ?? ""} placeholder="Cámara 6°" />
          <TextField label="Fecha de inicio" name="fecha_inicio" type="date" defaultValue={v?.fecha_inicio ?? ""} />
        </FormSection>

        <FormSection title="Partes y cliente">
          <TextField label="Parte actora" name="parte_actora" defaultValue={v?.parte_actora ?? ""} />
          {/* Demandados: campo oculto con el valor serializado + lista dinámica */}
          <input type="hidden" name="parte_demandada" value={demandados.filter(Boolean).join("\n")} />
          <div className="sm:col-span-2 flex flex-col gap-[6px]">
            <label className="block text-[12px] font-semibold text-sub">Parte/s demandada/s</label>
            {demandados.map((dem, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={dem}
                  onChange={(e) => updateDemandado(i, e.target.value)}
                  placeholder={i === 0 ? "Nombre del demandado principal" : `Demandado ${i + 1}`}
                  className="flex-1 rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue focus:ring-1 focus:ring-blue"
                />
                {demandados.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDemandado(i)}
                    className="flex cursor-pointer items-center justify-center rounded-[5px] p-[6px] text-muted hover:text-red hover:bg-red-lt/40 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addDemandado}
              className="flex w-fit cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-blue hover:underline"
            >
              <Plus size={12} />
              Agregar demandado
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
