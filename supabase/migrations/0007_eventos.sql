-- ─── EVENTOS ───
-- Sucesos futuros con fecha y hora: audiencias, mediaciones, pericias, reuniones.
-- Distintos de vencimientos (plazos procesales) y alertas (recordatorios internos).

CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Audiencia', -- Audiencia | Mediación | Pericial | Reunión | Otro
  fecha DATE NOT NULL,
  hora TIME,
  lugar TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- El usuario ve eventos de causas que le son accesibles (propias + compartidas)
CREATE POLICY "eventos_select" ON public.eventos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.causas c
      WHERE c.id = eventos.causa_id
        AND (
          c.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.causa_shares cs WHERE cs.causa_id = c.id AND cs.user_id = auth.uid())
        )
    )
  );

-- Solo puede insertar/modificar/borrar quien esté en la causa (titular o colaborador)
CREATE POLICY "eventos_insert" ON public.eventos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.causas c
      WHERE c.id = causa_id
        AND (
          c.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.causa_shares cs WHERE cs.causa_id = c.id AND cs.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "eventos_update" ON public.eventos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.causas c
      WHERE c.id = eventos.causa_id
        AND (
          c.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.causa_shares cs WHERE cs.causa_id = c.id AND cs.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "eventos_delete" ON public.eventos
  FOR DELETE USING (user_id = auth.uid());
