"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { createTodo, deleteTodo, updateTodo, updateTodoEstado } from "@/app/(app)/causas/todoActions";
import { useTodosGlobal } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import { formatDate, getDaysUntil } from "@/utils/formatters";
import type { EstadoTarea, TodoConCausa } from "@/types";
import DateInput from "@/components/ui/DateInput";

// ── Columnas del Kanban ──────────────────────────────────────────────────────

const COLUMNS: { estado: EstadoTarea; label: string; color: string; light: string }[] = [
  { estado: "Pendiente",            label: "Pendiente",             color: "var(--color-pur)", light: "var(--color-pur-lt)" },
  { estado: "En curso",             label: "En curso",              color: "var(--color-blue)", light: "var(--color-blue-lt)" },
  { estado: "Esperando respuesta",  label: "Esperando respuesta",   color: "var(--color-amb)", light: "var(--color-amb-lt)"  },
  { estado: "Completado",           label: "Completado",            color: "var(--color-grn)", light: "var(--color-grn-lt)"  },
];

const ALTO_MIN = 72;

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
  landed,
  onDelete,
  onEdit,
  onDragStart,
}: {
  todo: TodoConCausa;
  isDragging: boolean;
  landed: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string, texto: string, fechaLimite: string | null) => Promise<boolean>;
  onDragStart: (id: string, e: React.DragEvent) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(todo.texto);
  const [fecha, setFecha] = useState(todo.fecha_limite ?? "");
  const [guardando, setGuardando] = useState(false);
  const [alto, setAlto] = useState<number | null>(null);
  const redimensionando = useRef(false);
  const altoRef = useRef<number | null>(null);
  const claveAlto = `kanban-alto:${todo.id}`;

  useEffect(() => {
    try {
      const guardado = Number(localStorage.getItem(claveAlto));
      if (guardado >= ALTO_MIN) setAlto(guardado);
    } catch {
      // Sin localStorage (modo privado): la card usa el alto automático.
    }
  }, [claveAlto]);

  const moverResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!redimensionando.current) return;
    const base = e.currentTarget.parentElement?.getBoundingClientRect().top ?? 0;
    const nuevo = Math.max(ALTO_MIN, Math.round(e.clientY - base));
    altoRef.current = nuevo;
    setAlto(nuevo);
  };

  const terminarResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!redimensionando.current) return;
    redimensionando.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (altoRef.current === null) return;
    try {
      localStorage.setItem(claveAlto, String(altoRef.current));
    } catch {
      // Sin localStorage: el alto dura solo mientras la página esté abierta.
    }
  };

  const restablecerAlto = () => {
    setAlto(null);
    altoRef.current = null;
    try {
      localStorage.removeItem(claveAlto);
    } catch {
      // Sin localStorage: nada que limpiar.
    }
  };

  const cancelar = () => {
    setTexto(todo.texto);
    setFecha(todo.fecha_limite ?? "");
    setEditando(false);
  };

  const guardar = async () => {
    setGuardando(true);
    const ok = await onEdit(todo.id, texto, fecha || null);
    setGuardando(false);
    if (ok) setEditando(false);
  };

  if (editando) {
    return (
      <div className="rounded-lg border p-3" style={{ background: "var(--color-card)", borderColor: "var(--color-blue)" }}>
        <textarea
          autoFocus
          value={texto}
          maxLength={300}
          rows={2}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") cancelar(); }}
          aria-label="Modificar tarea"
          className="w-full resize-none bg-transparent text-[13px] text-text outline-none"
        />
        <DateInput
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          aria-label="Fecha límite"
          className="mt-2 w-full rounded-[6px] border border-border bg-bg px-2 py-[5px] text-[12px] text-text outline-none focus:border-blue"
        />
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={cancelar} className="rounded-[6px] px-2.5 py-[4px] text-[12px] text-sub hover:text-text">Cancelar</button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || !texto.trim()}
            className="rounded-[6px] bg-blue px-2.5 py-[4px] text-[12px] font-semibold text-on-primary disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        if (redimensionando.current) { e.preventDefault(); return; }
        onDragStart(todo.id, e);
      }}
      className={`group relative cursor-grab overflow-hidden rounded-lg border p-3 transition-[opacity,transform] duration-150 active:cursor-grabbing ${isDragging ? "opacity-40 scale-95" : ""} ${landed ? "kanban-land" : ""}`}
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,.07)",
        height: alto ?? undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex-1 text-[13px] font-medium leading-snug text-text">{todo.texto}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEditando(true); }}
            aria-label="Modificar tarea"
            className="cursor-pointer rounded p-[2px] text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }}
            className="cursor-pointer rounded p-[2px] text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red"
          >
            <X size={11} />
          </button>
        </div>
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
      <div
        role="separator"
        aria-label="Arrastrar para cambiar el alto de la tarea (doble clic para restablecer)"
        title="Arrastrá para cambiar el alto · doble clic para restablecer"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          redimensionando.current = true;
          altoRef.current = alto;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={moverResize}
        onPointerUp={terminarResize}
        onPointerCancel={terminarResize}
        onDoubleClick={(e) => { e.stopPropagation(); restablecerAlto(); }}
        className="absolute bottom-0 right-0 h-[14px] w-[14px] cursor-nwse-resize opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: "linear-gradient(135deg, transparent 50%, var(--color-muted) 50%)",
        }}
      />
    </div>
  );
}

const TareaCardMemo = memo(TareaCard);

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
      <DateInput
        name="fecha_limite"
        aria-label="Fecha límite"
        className="mt-2 w-full rounded-[5px] border border-border bg-bg px-2 py-[5px] text-[11.5px] text-sub outline-none focus:border-blue"
      />
      {error && <p className="mt-1 text-[11px] text-red">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={onClose}
          className="cursor-pointer rounded-[5px] px-2 py-[4px] text-[12px] text-muted hover:text-text">
          Cancelar
        </button>
        <button type="submit" disabled={pending}
          className="cursor-pointer rounded-[5px] bg-blue px-3 py-[4px] text-[12px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-60">
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
  const showToast = useUIStore((s) => s.showToast);
  const { data: todos, loading, reload, patch } = useTodosGlobal();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [addingIn, setAddingIn] = useState<EstadoTarea | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<EstadoTarea | null>(null);
  const [aterrizaje, setAterrizaje] = useState<string | null>(null);
  const [rebote, setRebote] = useState<EstadoTarea | null>(null);
  const dragId = useRef<string | null>(null);

  const filtered = todos.filter((t) =>
    filtro === "mias" ? t.user_id === userId : true,
  );

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    dragId.current = id;
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = async (e: React.DragEvent, targetEstado: EstadoTarea) => {
    e.preventDefault();
    const id = dragId.current;
    if (!id) return;
    const todo = todos.find((t) => t.id === id);
    if (!todo || todo.estado === targetEstado) { setDragging(null); setDragOver(null); return; }

    setDragging(null);
    setDragOver(null);
    setAterrizaje(id);
    setRebote(targetEstado);
    setTimeout(() => setAterrizaje((actual) => (actual === id ? null : actual)), 900);
    setTimeout(() => setRebote(null), 500);
    patch(id, { estado: targetEstado, completado: targetEstado === "Completado" });

    const result = await updateTodoEstado(id, targetEstado);
    if (result.error) {
      patch(id, { estado: todo.estado, completado: todo.completado });
      showToast({ message: result.error });
    }
  };

  const handleEdit = useCallback(async (id: string, texto: string, fechaLimite: string | null): Promise<boolean> => {
    const result = await updateTodo(id, texto, fechaLimite);
    if (result.error) { showToast({ message: result.error }); return false; }
    patch(id, { texto: texto.trim(), fecha_limite: fechaLimite || null });
    return true;
  }, [patch, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteTodo(id);
    if (result.error) { showToast({ message: result.error }); return; }
    reload();
  }, [reload, showToast]);

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
              filtro === f ? "border-blue bg-blue text-on-primary" : "border-border text-sub hover:bg-bg"
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
                  className={`rounded-full px-[7px] py-px text-[10px] font-bold ${rebote === estado ? "kanban-bump" : ""}`}
                  style={{ background: light, color }}
                >
                  {items.length}
                </span>
                <button
                  type="button"
                  onClick={() => setAddingIn(estado)}
                  aria-label={`Nueva tarea en ${label}`}
                  title={`Nueva tarea en ${label}`}
                  className="flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[6px] transition-colors hover:opacity-80"
                  style={{ background: light, color }}
                >
                  <Plus size={14} strokeWidth={2.4} />
                </button>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
                {items.map((t) => (
                  <TareaCardMemo
                    key={t.id}
                    todo={t}
                    isDragging={dragging === t.id}
                    landed={aterrizaje === t.id}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onDragStart={handleDragStart}
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
                    onSaved={reload}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingIn(estado)}
                    className="mt-auto flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed px-2 py-[7px] text-[12.5px] font-semibold transition-colors hover:opacity-80"
                    style={{ borderColor: color, color }}
                  >
                    <Plus size={14} strokeWidth={2.4} /> Nueva tarea
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
