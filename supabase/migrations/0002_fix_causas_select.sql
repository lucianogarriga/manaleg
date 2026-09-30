-- ═══════════════════════════════════════════════════════════════
-- Fix: INSERT ... RETURNING en causas fallaba con
-- "new row violates row-level security policy".
--
-- causas_select usaba user_can_access_causa(id), que consulta la tabla
-- causas con el snapshot previo al INSERT: la fila nueva todavía no
-- existe para la función, entonces el RETURNING no pasaba el SELECT.
-- Ahora el owner se valida directo sobre la columna user_id de la fila.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.causa_shared_with_me(causa_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.causa_shares
    WHERE causa_id = causa_uuid AND shared_with_user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.causa_shared_with_me(UUID) TO authenticated;

DROP POLICY "causas_select" ON public.causas;
CREATE POLICY "causas_select" ON public.causas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.causa_shared_with_me(id));

DROP POLICY "causas_update" ON public.causas;
CREATE POLICY "causas_update" ON public.causas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.causa_shared_with_me(id))
  WITH CHECK (auth.uid() = user_id OR public.causa_shared_with_me(id));
