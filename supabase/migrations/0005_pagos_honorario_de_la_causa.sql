-- ═══════════════════════════════════════════════════════════════
-- Fix de integridad en pagos
--
-- Antes, un pago solo validaba que el usuario tuviera acceso a la causa
-- indicada en pagos.causa_id. Nada impedía que honorario_id apuntara al
-- honorario de OTRA causa, y como el trigger update_monto_cobrado corre
-- con SECURITY DEFINER, eso permitía alterar el monto cobrado ajeno.
-- Ahora el honorario tiene que pertenecer a la misma causa del pago.
-- (La subquery aplica RLS de honorarios: si el usuario no ve ese
-- honorario, el pago se rechaza.)
-- ═══════════════════════════════════════════════════════════════

DROP POLICY "pagos_insert" ON public.pagos;
CREATE POLICY "pagos_insert" ON public.pagos
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = registrado_por_id
    AND public.user_can_access_causa(causa_id)
    AND EXISTS (
      SELECT 1 FROM public.honorarios h
      WHERE h.id = pagos.honorario_id AND h.causa_id = pagos.causa_id
    )
  );

DROP POLICY "pagos_update" ON public.pagos;
CREATE POLICY "pagos_update" ON public.pagos
  FOR UPDATE TO authenticated
  USING (public.user_can_access_causa(causa_id))
  WITH CHECK (
    public.user_can_access_causa(causa_id)
    AND EXISTS (
      SELECT 1 FROM public.honorarios h
      WHERE h.id = pagos.honorario_id AND h.causa_id = pagos.causa_id
    )
  );
