"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Calendar, Clock, MapPin, Pencil, Trash2, X } from "lucide-react";
import { guardarEvento, eliminarEvento } from "@/app/(app)/causas/eventoActions";
import CardSection, { CardAction } from "@/components/ui/CardSection";
import { useEventos } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import { formatDate } from "@/utils/formatters";
import { TIPOS_EVENTO } from "@/utils/constants";
import type { Evento } from "@/types";

const TIPO_STYLES: Record<string, { bg: string; text: string }> = {
  Audiencia: { bg: "bg-blue-lt", text: "text-blue" },
  Mediación: { bg: "bg-pur-lt", text: "text-pur" },
  Pericial: { bg: "bg-amb-lt", text: "text-amb" },
  Reunión: { bg: "bg-grn-lt", text: "text-grn" },
  Otro: { bg: "bg-slate-100", text: "text-sub" },
};

function EventoForm({
  causaId,
  evento,
  onClose,
  onSaved,
}: {
  causaId: string;
  evento: Evento | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const action = guardarEvento.bind(null, causaId, evento?.id ?? null);
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.message) onSaved(state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md rounded-xl bg-card p-5 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer text-muted hover:text-text"
        >
          <X size={16} />
        </button>
        <h3 className="mb-4 text-[15px] font-bold text-text">
          {evento ? "Editar evento" : "Nuevo evento"}
        </h3>
        <form action={formAction} className="space-y-3">
          <div>
            <label className="mb-[3px] block text-[11px] font-bold uppercase tracking-[.4px] text-[#1e3a6e]/70">
              Título *
            </label>
            <input
              name="titulo"
              required
              defaultValue={evento?.titulo ?? ""}
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[14px] text-text outline-none focus:border-blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-[3px] block text-[11px] font-bold uppercase tracking-[.4px] text-[#1e3a6e]/70">
                Tipo *
              </label>
              <select
                name="tipo"
                defaultValue={evento?.tipo ?? "Audiencia"}
                className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[14px] text-text outline-none focus:border-blue"
              >
                {TIPOS_EVENTO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-[3px] block text-[11px] font-bold uppercase tracking-[.4px] text-[#1e3a6e]/70">
                Fecha *
              </label>
              <input
                name="fecha"
                type="date"
                required
                defaultValue={evento?.fecha ?? ""}
                className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[14px] text-text outline-none focus:border-blue"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-[3px] block text-[11px] font-bold uppercase tracking-[.4px] text-[#1e3a6e]/70">
                Hora
              </label>
              <input
                name="hora"
                type="time"
                defaultValue={evento?.hora?.slice(0, 5) ?? ""}
                className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[14px] text-text outline-none focus:border-blue"
              />
            </div>
            <div>
              <label className="mb-[3px] block text-[11px] font-bold uppercase tracking-[.4px] text-[#1e3a6e]/70">
                Lugar
              </label>
              <input
                name="lugar"
                defaultValue={evento?.lugar ?? ""}
                className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[14px] text-text outline-none focus:border-blue"
              />
            </div>
          </div>
          <div>
            <label className="mb-[3px] block text-[11px] font-bold uppercase tracking-[.4px] text-[#1e3a6e]/70">
              Notas
            </label>
            <textarea
              name="notas"
              rows={2}
              defaultValue={evento?.notas ?? ""}
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[14px] text-text outline-none focus:border-blue"
            />
          </div>
          {state.error && (
            <p className="text-[13px] text-red">{state.error}</p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[13.5px] font-semibold text-sub hover:text-text"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer rounded-[6px] bg-blue px-4 py-[7px] text-[13.5px] font-semibold text-white disabled:opacity-60 hover:opacity-90"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventoRow({ evento, onEdit, onDelete }: { evento: Evento; onEdit: () => void; onDelete: () => void }) {
  const style = TIPO_STYLES[evento.tipo] ?? TIPO_STYLES.Otro;
  return (
    <div className="group flex items-start gap-3 py-[9px]">
      <div className="shrink-0 pt-[2px]">
        <span className={`rounded-[4px] px-2 py-[2px] text-[11px] font-semibold ${style.bg} ${style.text}`}>
          {evento.tipo}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-text">{evento.titulo}</div>
        <div className="mt-[2px] flex flex-wrap items-center gap-x-3 gap-y-[2px] text-[12px] text-muted">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(evento.fecha)}
          </span>
          {evento.hora && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {evento.hora.slice(0, 5)}
            </span>
          )}
          {evento.lugar && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {evento.lugar}
            </span>
          )}
        </div>
        {evento.notas && (
          <div className="mt-[3px] text-[12px] text-sub">{evento.notas}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="flex cursor-pointer text-muted hover:text-blue"
          aria-label="Editar evento"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex cursor-pointer text-muted hover:text-red"
          aria-label="Eliminar evento"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function EventosSection({
  causaId,
  naked = false,
}: {
  causaId: string;
  naked?: boolean;
}) {
  const router = useRouter();
  const { data, loading, error, reload } = useEventos(causaId);
  const [formEvento, setFormEvento] = useState<Evento | null | "new">(null);
  const showToast = useUIStore((s) => s.showToast);

  const afterChange = (msg: string) => {
    setFormEvento(null);
    showToast({ message: msg });
    reload();
    router.refresh();
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    const result = await eliminarEvento(id);
    if (result.error) return showToast({ message: result.error });
    afterChange(result.message ?? "Evento eliminado.");
  };

  const inner = loading ? (
    <div className="space-y-2 py-3" aria-busy="true">
      <div className="h-[14px] w-3/4 animate-pulse rounded bg-slate-100" />
      <div className="h-[14px] w-1/2 animate-pulse rounded bg-slate-100" />
    </div>
  ) : error ? (
    <p className="py-3 text-[13px] text-red">No se pudieron cargar los eventos: {error}</p>
  ) : data.length === 0 ? (
    <p className="py-3 text-[13.5px] text-muted">Todavía no hay eventos cargados para esta causa.</p>
  ) : (
    <div className="divide-y divide-border/60">
      {data.map((e) => (
        <EventoRow
          key={e.id}
          evento={e}
          onEdit={() => setFormEvento(e)}
          onDelete={() => onDelete(e.id)}
        />
      ))}
    </div>
  );

  const addBtn = (
    <button
      type="button"
      onClick={() => setFormEvento("new")}
      className="cursor-pointer text-[13px] font-semibold text-blue hover:underline"
    >
      + Agregar
    </button>
  );

  return (
    <>
      {naked ? (
        <div>
          <div className="flex justify-end px-[13px] pb-2 pt-1">{addBtn}</div>
          <div className="px-[13px] pb-3">{inner}</div>
        </div>
      ) : (
        <CardSection title="Eventos" action={<CardAction onClick={() => setFormEvento("new")}>+ Agregar</CardAction>}>
          <div className="px-[13px] py-2">{inner}</div>
        </CardSection>
      )}

      {formEvento !== null && (
        <EventoForm
          causaId={causaId}
          evento={formEvento === "new" ? null : formEvento}
          onClose={() => setFormEvento(null)}
          onSaved={afterChange}
        />
      )}
    </>
  );
}
