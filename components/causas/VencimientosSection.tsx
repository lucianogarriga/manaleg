"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Calendar, CheckCircle2, Circle, Clock, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createVencimientoRow,
  deleteVencimientoRow,
  toggleVencimientoCompletado,
  updateVencimientoRow,
} from "@/app/(app)/causas/detailActions";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useUIStore } from "@/store/uiStore";
import { useVencimientos } from "@/hooks/useCausaData";
import FormAlert from "@/components/auth/FormAlert";
import { formatDate } from "@/utils/formatters";
import type { FormState, Vencimiento } from "@/types";

const TIPOS = ["Vencimiento", "Audiencia", "Recordatorio"] as const;
const ANTICIPACIONES = ["1 día", "3 días", "1 semana"] as const;

const TIPO_STYLE: Record<string, string> = {
  Audiencia:    "bg-pur-lt text-pur",
  Recordatorio: "bg-blue-lt text-blue",
  Vencimiento:  "bg-amb-lt text-amb",
};

interface Props {
  causaId: string;
  esTitular: boolean;
}

interface FormRowProps {
  causaId: string;
  editTarget?: Vencimiento;
  onClose: () => void;
  onDone: (msg: string) => void;
}

function VencimientoFormRow({ causaId, editTarget, onClose, onDone }: FormRowProps) {
  const action = editTarget ? updateVencimientoRow : createVencimientoRow;
  const [state, dispatch, pending] = useActionState<FormState, FormData>(action, {});
  const [, startT] = useTransition();
  const [tipo, setTipo] = useState<string>(editTarget?.tipo ?? "Vencimiento");

  useEffect(() => {
    if (state.message) onDone(state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startT(() => dispatch(fd));
  };

  const inputCls = "rounded-[6px] border border-border bg-bg px-2 py-[6px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue";

  return (
    <form
      onSubmit={onSubmit}
      className="col-span-full rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
    >
      {editTarget && <input type="hidden" name="id" value={editTarget.id} />}
      {!editTarget && <input type="hidden" name="causa_id" value={causaId} />}

      {state.error && <FormAlert state={state} />}

      {/* Fila 1: tipo + fecha + anticipación */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-sub">Tipo</label>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={inputCls}
          >
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-sub">Fecha</label>
          <input
            type="date"
            name="fecha"
            defaultValue={editTarget?.fecha ?? ""}
            required
            className={inputCls}
          />
        </div>

        {tipo !== "Recordatorio" && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-sub">Anticipación aviso</label>
            <select name="anticipacion" defaultValue={editTarget?.anticipacion ?? "1 día"} className={inputCls}>
              {ANTICIPACIONES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        )}

        <div className={`flex flex-col gap-1 ${tipo !== "Recordatorio" ? "" : "col-span-2 sm:col-span-2"}`}>
          <label className="text-[11px] font-semibold text-sub">Motivo (opcional)</label>
          <input
            type="text"
            name="motivo"
            defaultValue={editTarget?.motivo ?? ""}
            placeholder={tipo === "Audiencia" ? "Ej: Audiencia de vista de causa" : tipo === "Vencimiento" ? "Ej: Contestar demanda" : "Ej: Llamar al cliente"}
            maxLength={200}
            className={inputCls}
          />
        </div>
      </div>

      {/* Fila 2: campos extra según tipo */}
      {tipo === "Audiencia" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-sub">Hora</label>
            <input
              type="time"
              name="hora"
              defaultValue={editTarget?.hora?.slice(0, 5) ?? ""}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-sub">Lugar / Juzgado</label>
            <input
              type="text"
              name="lugar"
              defaultValue={editTarget?.lugar ?? ""}
              placeholder="Ej: Juzgado Civil N° 5"
              maxLength={150}
              className={inputCls}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <label className="text-[11px] font-semibold text-sub">Notas</label>
            <input
              type="text"
              name="notas"
              defaultValue={editTarget?.notas ?? ""}
              placeholder="Notas adicionales…"
              maxLength={300}
              className={inputCls}
            />
          </div>
        </div>
      )}

      {tipo === "Vencimiento" && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-sub">Acto procesal</label>
          <input
            type="text"
            name="acto_procesal"
            defaultValue={editTarget?.acto_procesal ?? ""}
            placeholder="Ej: Presentación de escrito, pericia, etc."
            maxLength={200}
            className={inputCls}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-[6px] border border-border bg-card px-3 py-[5px] text-[13px] font-medium text-sub hover:bg-bg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-[6px] bg-blue px-4 py-[5px] text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Guardando…" : editTarget ? "Actualizar" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

export default function VencimientosSection({ causaId, esTitular }: Props) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const { data: vencimientos, reload } = useVencimientos(causaId);
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [toggling, startToggle] = useTransition();

  const done = (msg: string) => {
    showToast({ message: msg });
    reload();
    router.refresh();
  };

  const handleToggle = (v: Vencimiento) => {
    startToggle(async () => {
      const r = await toggleVencimientoCompletado(v.id, !v.completado);
      if (r.error) showToast({ message: r.error });
      else { reload(); router.refresh(); }
    });
  };

  const handleDelete = async (v: Vencimiento) => {
    const ok = await confirmRequest({
      title: `Eliminar ${v.tipo.toLowerCase()}`,
      message: `¿Eliminar este ${v.tipo.toLowerCase()}?`,
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    const r = await deleteVencimientoRow(v.id);
    showToast({ message: r.error ?? r.message ?? "Listo." });
    if (!r.error) { reload(); router.refresh(); }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {vencimientos.map((v) => {
          const isEditing = editId === v.id;
          if (isEditing) {
            return (
              <VencimientoFormRow
                key={v.id}
                causaId={causaId}
                editTarget={v}
                onClose={() => setEditId(null)}
                onDone={(msg) => { setEditId(null); done(msg); }}
              />
            );
          }
          return (
            <div
              key={v.id}
              className={`flex flex-col gap-2 rounded-xl border p-3 ${v.completado ? "opacity-55" : ""}`}
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
            >
              {/* Header: badge + acciones */}
              <div className="flex items-start gap-2">
                <span className={`shrink-0 rounded-[4px] px-[6px] py-[2px] text-[11px] font-semibold uppercase tracking-[.3px] ${TIPO_STYLE[v.tipo] ?? "bg-border text-sub"}`}>
                  {v.tipo}
                </span>
                <span className="ml-auto flex items-center gap-[6px]">
                  {esTitular && (
                    <>
                      <button type="button" title="Editar" onClick={() => { setAddOpen(false); setEditId(v.id); }} className="cursor-pointer text-sub hover:text-text">
                        <Pencil size={13} />
                      </button>
                      <button type="button" title="Eliminar" onClick={() => handleDelete(v)} className="cursor-pointer text-sub hover:text-red">
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </span>
              </div>

              {/* Fecha */}
              <div className="text-[14px] font-semibold text-text">{formatDate(v.fecha)}</div>

              {/* Motivo / acto procesal */}
              {v.motivo && <div className="text-[12.5px] text-sub leading-snug">{v.motivo}</div>}
              {v.acto_procesal && <div className="text-[12.5px] text-sub leading-snug">{v.acto_procesal}</div>}

              {/* Campos de Audiencia */}
              {(v.hora || v.lugar || v.notas) && (
                <div className="flex flex-col gap-[3px]">
                  {v.hora && (
                    <span className="flex items-center gap-1 text-[11.5px] text-muted">
                      <Clock size={11} /> {v.hora.slice(0, 5)}
                    </span>
                  )}
                  {v.lugar && (
                    <span className="flex items-center gap-1 text-[11.5px] text-muted">
                      <MapPin size={11} /> {v.lugar}
                    </span>
                  )}
                  {v.notas && (
                    <span className="flex items-center gap-1 text-[11.5px] text-muted">
                      <Calendar size={11} /> {v.notas}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
                {v.tipo !== "Recordatorio" ? (
                  <span className="text-[11px] text-muted">Aviso: {v.anticipacion} antes</span>
                ) : (
                  <span className="text-[11px] text-muted">Sin aviso por email</span>
                )}
                {esTitular && (
                  <button
                    type="button"
                    disabled={toggling}
                    onClick={() => handleToggle(v)}
                    className={`flex cursor-pointer items-center gap-1 text-[11.5px] font-medium ${v.completado ? "text-grn" : "text-muted hover:text-text"}`}
                  >
                    {v.completado
                      ? <><CheckCircle2 size={13} /> Completado</>
                      : <><Circle size={13} /> Pendiente</>
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Form de nuevo */}
        {addOpen && (
          <VencimientoFormRow
            causaId={causaId}
            onClose={() => setAddOpen(false)}
            onDone={(msg) => { setAddOpen(false); done(msg); }}
          />
        )}
      </div>

      {vencimientos.length === 0 && !addOpen && (
        <p className="text-[13px] text-muted">Sin eventos ni vencimientos cargados.</p>
      )}

      {esTitular && !addOpen && (
        <button
          type="button"
          onClick={() => { setEditId(null); setAddOpen(true); }}
          className="flex w-fit cursor-pointer items-center gap-1 text-[13px] font-semibold text-blue hover:underline"
        >
          <Plus size={13} /> Agregar
        </button>
      )}
      {confirmDialog}
    </div>
  );
}
