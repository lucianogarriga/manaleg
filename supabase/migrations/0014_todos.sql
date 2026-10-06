-- Tabla de tareas/TODOs por causa
CREATE TABLE IF NOT EXISTS public.todos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  causa_id    UUID        REFERENCES public.causas(id) ON DELETE CASCADE,
  texto       TEXT        NOT NULL CHECK (char_length(texto) <= 300),
  completado  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve y modifica sus propias tareas
CREATE POLICY "user_owns_todos" ON public.todos
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para listar tareas de una causa eficientemente
CREATE INDEX IF NOT EXISTS todos_causa_id_idx ON public.todos (causa_id, created_at);
