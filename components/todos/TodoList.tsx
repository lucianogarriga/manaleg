"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { addTodo, removeTodo, toggleTodo } from "@/app/(app)/causas/todoActions";
import { useTodos } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import type { FormState } from "@/types";

export default function TodoList({ causaId }: { causaId: string }) {
  const router = useRouter();
  const { data: todos, loading, reload } = useTodos(causaId);
  const showToast = useUIStore((s) => s.showToast);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, dispatch, pending] = useActionState<FormState, FormData>(addTodo, {});
  const [, startAdd] = useTransition();

  useEffect(() => {
    if (state.message) {
      reload();
      router.refresh();
      if (inputRef.current) inputRef.current.value = "";
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startAdd(() => dispatch(new FormData(e.currentTarget)));
  };

  const onToggle = async (id: string, current: boolean) => {
    const result = await toggleTodo(id, !current);
    if (result.error) showToast({ message: result.error });
    reload();
    router.refresh();
  };

  const onDelete = async (id: string) => {
    const result = await removeTodo(id);
    if (result.error) showToast({ message: result.error });
    else { reload(); router.refresh(); }
  };

  const pendientes = todos.filter((t) => !t.completado);
  const completadas = todos.filter((t) => t.completado);

  return (
    <div className="flex flex-col">
      {/* Add form */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-b border-border/60 px-[14px] py-[9px]">
        <input type="hidden" name="causa_id" value={causaId} />
        <input
          ref={inputRef}
          name="texto"
          maxLength={300}
          placeholder="Agregar tarea…"
          className="flex-1 bg-transparent text-[13px] text-text placeholder:text-muted outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 cursor-pointer rounded-[5px] bg-blue px-3 py-[4px] text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "…" : "+ Agregar"}
        </button>
      </form>
      {state.error && (
        <p className="px-[14px] py-1 text-[12px] text-red">{state.error}</p>
      )}

      {loading ? (
        <p className="px-[14px] py-3 text-[13px] text-muted">Cargando…</p>
      ) : todos.length === 0 ? (
        <p className="px-[14px] py-3 text-[13.5px] text-muted">Sin tareas para esta causa.</p>
      ) : (
        <>
          {pendientes.map((t) => (
            <TodoItem key={t.id} texto={t.texto} completado={false}
              onToggle={() => onToggle(t.id, t.completado)}
              onDelete={() => onDelete(t.id)} />
          ))}
          {completadas.length > 0 && (
            <>
              <p className="px-[14px] pt-[10px] pb-[4px] text-[11px] font-bold uppercase tracking-[.4px] text-muted">
                Completadas ({completadas.length})
              </p>
              {completadas.map((t) => (
                <TodoItem key={t.id} texto={t.texto} completado
                  onToggle={() => onToggle(t.id, t.completado)}
                  onDelete={() => onDelete(t.id)} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

function TodoItem({
  texto, completado, onToggle, onDelete,
}: {
  texto: string; completado: boolean;
  onToggle: () => void; onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-[10px] border-t border-border/50 px-[14px] py-[7px]">
      <input
        type="checkbox"
        checked={completado}
        onChange={onToggle}
        className="h-[14px] w-[14px] shrink-0 cursor-pointer"
        style={{ accentColor: "var(--color-blue)", colorScheme: "light dark" }}
      />
      <span className={`flex-1 text-[13px] ${completado ? "text-muted line-through" : "text-text"}`}>
        {texto}
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Eliminar tarea"
        className="flex cursor-pointer text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red focus:opacity-100"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
