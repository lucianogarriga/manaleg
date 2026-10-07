-- Extiende la tabla todos para soportar el Kanban de tareas
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'Pendiente',
  ADD COLUMN IF NOT EXISTS fecha_limite date NULL;

-- Migrar completado=true → estado='Completado'
UPDATE public.todos SET estado = 'Completado' WHERE completado = true;
