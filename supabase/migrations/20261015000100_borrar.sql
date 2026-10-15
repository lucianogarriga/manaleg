-- ═══════════════════════════════════════════════════════════════
-- Restablece el borrado de honorarios, pagos y gastos (hallazgo B-2).
-- La migración 0024 eliminó estas políticas y nunca las recreó, así que
-- cualquier DELETE devolvía 0 filas.
--   honorarios y pagos: solo el titular de la causa (los montos son suyos).
--   gastos: quien lo cargó.
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "honorarios_delete" ON public.honorarios;
CREATE POLICY "honorarios_delete" ON public.honorarios
  FOR DELETE TO authenticated
  USING (private.user_owns_causa(causa_id));

DROP POLICY IF EXISTS "pagos_delete" ON public.pagos;
CREATE POLICY "pagos_delete" ON public.pagos
  FOR DELETE TO authenticated
  USING (private.user_owns_causa(causa_id));

DROP POLICY IF EXISTS "gastos_delete" ON public.gastos;
CREATE POLICY "gastos_delete" ON public.gastos
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));
