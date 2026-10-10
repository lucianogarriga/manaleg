-- ═══════════════════════════════════════════════════════════════
-- Security Advisor fixes
--
-- 1. Revoke EXECUTE from anon on all SECURITY DEFINER functions
--    (they should never be called anonymously via REST RPC).
-- 2. Revoke EXECUTE from authenticated on internal trigger functions
--    (they exist only to be called by the trigger system, not by users).
-- 3. Fix mutable search_path on check_causas_limit (recreate with SET search_path = '').
--
-- The 'leaked password protection' warning must be enabled from the
-- Supabase dashboard: Authentication → Settings → Password strength.
-- ═══════════════════════════════════════════════════════════════

-- ── Revoke from PUBLIC (roles inherit from PUBLIC, so FROM anon/authenticated is not enough) ──
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_causa_update()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_honorario()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_movimiento()         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_pago()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_share()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_proximo_vencimiento()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_causa_on_movimiento()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_monto_cobrado()         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_causas_limit()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_can_access_causa(uuid)    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_owns_causa(uuid)          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.causa_shared_with_me(uuid)     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.buscar_perfil_por_email(text)  FROM PUBLIC;

-- ── Re-grant to authenticated only where needed (RLS helpers + sharing feature) ──
-- Trigger functions need no grant: postgres calls them via trigger infrastructure.
GRANT EXECUTE ON FUNCTION public.user_can_access_causa(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_causa(uuid)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.causa_shared_with_me(uuid)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_perfil_por_email(text)  TO authenticated;

-- ── Fix mutable search_path on check_causas_limit ───────────
-- Recreate with SET search_path = '' to prevent search-path injection.
CREATE OR REPLACE FUNCTION public.check_causas_limit()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
  v_max   INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM public.causas
    WHERE user_id = NEW.user_id;

  SELECT causas_max INTO v_max
    FROM public.profiles
    WHERE id = NEW.user_id;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Límite de causas alcanzado (máx. %)', v_max;
  END IF;

  RETURN NEW;
END;
$$;

-- Note: check_causas_limit is already covered by the REVOKE FROM PUBLIC above.
