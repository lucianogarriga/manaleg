-- ═══════════════════════════════════════════════════════════════
-- Alinear políticas de causa_shares y causas con producción.
--
-- Producción usa private.* (SECURITY DEFINER); staging venía usando
-- public.* desde las migraciones 0001/0002. Esta migración recrea
-- las tres políticas afectadas para que coincidan exactamente.
-- ═══════════════════════════════════════════════════════════════

-- ─── causa_shares ──────────────────────────────────────────────
DROP POLICY IF EXISTS "causa_shares_select" ON public.causa_shares;

CREATE POLICY "causa_shares_select" ON public.causa_shares
  FOR SELECT TO authenticated
  USING (private.user_can_access_causa(causa_id));

-- ─── causas ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "causas_select" ON public.causas;

CREATE POLICY "causas_select" ON public.causas
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR private.causa_shared_with_me(id)
  );

DROP POLICY IF EXISTS "causas_update" ON public.causas;

CREATE POLICY "causas_update" ON public.causas
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR private.causa_shared_with_me(id)
  );
