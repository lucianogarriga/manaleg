"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createTodo, deleteTodo, updateTodoEstado } from "@/app/(app)/causas/todoActions";
import { useTodosGlobal } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import { formatDate, getDaysUntil } from "@/utils/formatters";
import type { EstadoTarea, TodoConCausa } from "@/types";

// ── Columnas del Kanban ──────────────────────────────────────────────────────

const COLUMNS: { estado: EstadoTarea; label: string; color: string; light: string }[] = [
  { estado: "Pendiente",            label: "Pendiente",             color: "var(--color-pur)", light: "var(--color-pur-lt)" },
  { estado: "En curso",             label: "En curso",              color: "var(--color-blue)", light: "var(--color-blue-lt)" },
  { estado: "Esperando respuesta",  label: "Esperando respuesta",   color: "var(--color-amb)", light: "var(--color-amb-lt)"  },
  { estado: "Completado",           label: "Completado",            color: "var(--color-grn)", light: "var(--color-grn-lt)"  },
];

// ── Filtros ──────────────────────────────────────────────────────────────────

type Filtro = "todas" | "mias";

// ── Fecha límite ─────────────────────────────────────────────────────────────

function FechaLimiteBadge({ fecha }: { fecha: string | null }) {
  if (!fecha) return null;
  const days = getDaysUntil(fecha) ?? 0;
  const vencida = days < 0;
  const hoy = days === 0;
  const pronto = days <= 3;
  const cls = vencida ? "bg-red-lt text-red" : hoy ? "bg-amb-lt text-amb" : pronto ? "bg-amb-lt/60 text-amb" : "bg-border text-muted";
  const label = vencida ? `Venció ${formatDate(fecha)}` : hoy ? "Vence hoy" : `Vence ${formatDate(fecha)}`;
  return (
    <span className={`inline-block rounded-[4px] px-[5px] py-[1px] text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ── Tarjeta de tarea ─────────────────────────────────────────────────────────

function TareaCard({
  todo,
  isDragging,
  onDelete,
  onDragStart,
}: {
  todo: TodoConCausa;
  isDragging: boolean;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group cursor-grab rounded-lg border p-3 transition-all active:cursor-grabbing ${isDragging ? "opacity-40 scale-95" : ""}`}
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,.07)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex-1 text-[13px] font-medium leading-snug text-text">{todo.texto}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 cursor-pointer rounded p-[2px] text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red"
        >
          <X size={11} />
        </button>
      </div>

      {todo.causa && (
        <div className="mt-[6px] truncate text-[11px] text-blue/80">
          {todo.causa.nro_expediente ? `${todo.causa.nro_expediente} — ` : ""}{todo.causa.caratula}
        </div>
      )}

      {todo.fecha_limite && (
        <div className="mt-[5px]">
          <FechaLimiteBadge fecha={todo.fecha_limite} />
        </div>
      )}
    </div>
  );
}

// ── Formulario de nueva tarea en columna ──────────────────────────────────────

function NuevaTareaForm({
  estado,
  causas,
  onClose,
  onSaved,
}: {
  estado: EstadoTarea;
  causas: { id: string; caratula: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("estado", estado);
    setPending(true);
    setError(null);
    const result = await createTodo({}, fd);
    setPending(false);
    if (result.error) { setError(result.error); return; }
    onSaved();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-1 rounded-lg border border-border bg-card p-2 shadow-sm">
      <input
        name="texto"
        required
        maxLength={300}
        autoFocus
        placeholder="Título de la tarea…"
        className="w-full bg-transparent text-[13px] text-text placeholder:text-muted outline-none"
      />
      <select
        name="causa_id"
        className="mt-2 w-full rounded-[5px] border border-border bg-bg px-2 py-[5px] text-[11.5px] text-sub outline-none focus:border-blue"
      >
        <option value="">Sin causa vinculada</option>
        {causas.map((c) => (
          <option key={c.id} value={c.id}>{c.caratula}</option>
        ))}
      </select>
      <input
        name="fecha_limite"
        type="date"
        className="mt-2 w-full rounded-[5px] border border-border bg-bg px-2 py-[5px] text-[11.5px] text-sub outline-none focus:border-blue"
      />
      {error && <p className="mt-1 text-[11px] text-red">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={onClose}
          className="cursor-pointer rounded-[5px] px-2 py-[4px] text-[12px] text-muted hover:text-text">
          Cancelar
        </button>
        <button type="submit" disabled={pending}
          className="cursor-pointer rounded-[5px] bg-blue px-3 py-[4px] text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {pending ? "…" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

// ── KanbanView ────────────────────────────────────────────────────────────────

interface KanbanViewProps {
  causas: { id: string; caratula: string }[];
  userId: string;
}

export default function KanbanView({ causas, userId }: KanbanViewProps) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const { data: todos, loading, reload } = useTodosGlobal();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [addingIn, setAddingIn] = useState<EstadoTarea | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<EstadoTarea | null>(null);
  const dragId = useRef<string | null>(null);

  const filtered = todos.filter((t) =>
    filtro === "mias" ? t.user_id === userId : true,
  );

  const handleDrop = async (e: React.DragEvent, targetEstado: EstadoTarea) => {
    e.preventDefault();
    const id = dragId.current;
    if (!id) return;
    const todo = todos.find((t) => t.id === id);
    if (!todo || todo.estado === targetEstado) { setDragging(null); setDragOver(null); return; }

    setDragging(null);
    setDragOver(null);

    const result = await updateTodoEstado(id, targetEstado);
    if (result.error) { showToast({ message: result.error }); return; }
    showToast({ message: `Tarea movida a "${targetEstado}"` });
    reload();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTodo(id);
    if (result.error) { showToast({ message: result.error }); return; }
    reload();
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filtros */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
        {(["todas", "mias"] as Filtro[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`inline-flex cursor-pointer items-center rounded-[20px] border px-3 py-[3px] text-[12px] font-medium transition-colors ${
              filtro === f ? "border-blue bg-blue text-white" : "border-border text-sub hover:bg-bg"
            }`}
          >
            {f === "todas" ? "Todas las tareas" : "Mis tareas"}
          </button>
        ))}
        {loading && <span className="ml-auto text-[11px] text-muted">Cargando…</span>}
      </div>

      {/* Columnas */}
      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {COLUMNS.map(({ estado, label, color, light }) => {
          const items = filtered.filter((t) => t.estado === estado);
          const isOver = dragOver === estado;

          return (
            <div
              key={estado}
              className="flex w-[240px] shrink-0 flex-col rounded-xl transition-colors duration-150"
              style={{
                background: isOver ? light : "var(--color-bg)",
                minHeight: "100%",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(estado); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, estado)}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 pb-2 pt-3">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="flex-1 text-[12.5px] font-semibold text-text">{label}</span>
                <span
                  className="rounded-full px-[7px] py-px text-[10px] font-bold"
                  style={{ background: light, color }}
                >
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
                {items.map((t) => (
                  <TareaCard
                    key={t.id}
                    todo={t}
                    isDragging={dragging === t.id}
                    onDelete={() => handleDelete(t.id)}
                    onDragStart={(e) => {
                      dragId.current = t.id;
                      setDragging(t.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  />
                ))}

                {/* Columna vacía */}
                {items.length === 0 && !isOver && addingIn !== estado && (
                  <div
                    className="rounded-lg border border-dashed py-3 text-center text-[11px] text-muted"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    Sin tareas
                  </div>
                )}

                {/* Formulario inline */}
                {addingIn === estado ? (
                  <NuevaTareaForm
                    estado={estado}
                    causas={causas}
                    onClose={() => setAddingIn(null)}
                    onSaved={() => { reload(); router.refresh(); }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingIn(estado)}
                    className="mt-auto flex cursor-pointer items-center gap-1 rounded-[6px] px-2 py-[5px] text-[12px] text-muted transition-colors hover:bg-border/60 hover:text-sub"
                  >
                    <Plus size={13} /> Nueva tarea
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
