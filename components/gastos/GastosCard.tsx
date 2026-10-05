"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { addGasto, removeGasto, TIPOS_GASTO } from "@/app/(app)/causas/gastoActions";
import CardSection, { CardAction } from "@/components/ui/CardSection";
import Modal from "@/components/ui/Modal";
import FormAlert from "@/components/auth/FormAlert";
import { useGastos } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { FormState } from "@/types";

function GastoForm({
  causaId,
  onClose,
  onSaved,
}: {
  causaId: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(addGasto, {});
  const [, startSubmit] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startSubmit(() =>
      action(fd).then((s) => {
        if (s.message) onSaved(s.message);
      }),
    );
  };

  // Cierra el modal cuando el Server Action devuelve éxito
  // (useActionState no expone Promise directamente; usamos useEffect vía onSaved en action)
  return (
    <Modal open title="Registrar gasto" onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose}
            className="ml-auto cursor-pointer rounded-[6px] border border-border bg-card px-3 py-[6px] text-[14px] font-medium text-sub hover:bg-bg">
            Cancelar
          </button>
          <button type="submit" form="gasto-form" disabled={pending}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {pending ? "Guardando…" : "Registrar"}
          </button>
        </div>
      }
    >
      <form id="gasto-form" onSubmit={onSubmit} className="flex flex-col gap-3 px-4 py-3">
        <input type="hidden" name="causa_id" value={causaId} />
        {state.error && <FormAlert state={state} />}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-sub mb-1">Descripción <span className="text-red">*</span></label>
            <input name="descripcion" required maxLength={500} placeholder="Carta documento a demandado"
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue focus:ring-1 focus:ring-blue" />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-sub mb-1">Tipo</label>
            <select name="tipo"
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text outline-none focus:border-blue">
              <option value="">Sin clasificar</option>
              {TIPOS_GASTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-sub mb-1">Fecha</label>
            <input name="fecha" type="date"
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text outline-none focus:border-blue" />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-sub mb-1">Monto ($)</label>
            <input name="monto" inputMode="decimal" placeholder="2500"
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue" />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-sub mb-1">Link comprobante</label>
            <input name="comprobante_url" type="url" placeholder="https://drive.google.com/…"
              className="w-full rounded-[6px] border border-border bg-bg px-3 py-[7px] text-[13px] text-text placeholder:text-muted outline-none focus:border-blue" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function GastosCard({ causaId }: { causaId: string }) {
  const router = useRouter();
  const { data: gastos, loading, error, reload } = useGastos(causaId);
  const [formOpen, setFormOpen] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  const afterAdd = (msg: string) => {
    setFormOpen(false);
    showToast({ message: msg });
    reload();
    router.refresh();
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    const result = await removeGasto(id);
    if (result.error) return showToast({ message: result.error });
    showToast({ message: result.message ?? "Gasto eliminado." });
    reload();
    router.refresh();
  };

  const total = gastos.reduce((s, g) => s + (g.monto ?? 0), 0);

  const inner = loading ? (
    <div className="space-y-2 px-[13px] py-[14px]">
      <div className="h-[14px] w-2/5 animate-pulse rounded bg-border" />
    </div>
  ) : error ? (
    <p className="px-[13px] py-4 text-[13px] text-red">No se pudieron cargar los gastos: {error}</p>
  ) : gastos.length === 0 ? (
    <p className="px-[13px] py-4 text-[13.5px] text-muted">
      No hay gastos registrados para esta causa.
    </p>
  ) : (
    <>
      <div className="px-[13px] py-[9px]">
        <span className="text-[13px] font-semibold text-sub">
          Total gastos: <span className="text-text">{formatCurrency(total)}</span>
          <span className="ml-2 text-[11px] font-normal text-muted">({gastos.length} {gastos.length === 1 ? "gasto" : "gastos"})</span>
        </span>
      </div>
      {gastos.map((g) => (
        <div key={g.id} className="group flex items-center gap-2 border-t border-border px-[14px] py-[6px]">
          <span className="w-[62px] shrink-0 text-[11px] text-muted">{formatDate(g.fecha)}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] text-text">{g.descripcion}</div>
            {g.tipo && <div className="text-[11px] text-muted">{g.tipo}</div>}
          </div>
          {g.comprobante_url && (
            <a href={g.comprobante_url} target="_blank" rel="noopener noreferrer"
              aria-label="Ver comprobante"
              className="flex text-muted hover:text-blue">
              <ExternalLink size={11} />
            </a>
          )}
          <span className="shrink-0 text-[13.5px] font-semibold text-text">{formatCurrency(g.monto)}</span>
          <button type="button" onClick={() => onDelete(g.id)} aria-label="Eliminar gasto"
            className="flex cursor-pointer text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red focus:opacity-100">
            <Trash2 size={11} />
          </button>
        </div>
      ))}
    </>
  );

  return (
    <>
      <CardSection title="Gastos" action={<CardAction onClick={() => setFormOpen(true)}>+ Registrar gasto</CardAction>}>
        {inner}
      </CardSection>
      {formOpen && <GastoForm causaId={causaId} onClose={() => setFormOpen(false)} onSaved={afterAdd} />}
    </>
  );
}
