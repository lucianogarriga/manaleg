-- ═══════════════════════════════════════════════════════════════
-- Alinear funciones, trigger y policies de causas/causa_shares con producción.
--
-- - proteger_owner_causa + trigger: producción lo tiene; staging no.
-- - buscar_perfil_por_email: producción no devuelve email.
-- - causa_shares: pasa a private.user_owns_causa y quita la policy
--   causa_shares_no_update (producción no la tiene; el efecto es el mismo).
-- - causas_update y causa_shares_select quedan con el texto de producción.
-- - Se eliminan las funciones public.* que quedaron de 0001/0002.
-- ═══════════════════════════════════════════════════════════════

-- ─── Protección del owner de la causa ──────────────────────────
CREATE OR REPLACE FUNCTION public.proteger_owner_causa()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'No se puede cambiar el owner de una causa.';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_proteger_owner_causa ON public.causas;

CREATE TRIGGER trg_proteger_owner_causa
  BEFORE UPDATE ON public.causas
  FOR EACH ROW EXECUTE FUNCTION public.proteger_owner_causa();

-- ─── Policies que usaban funciones public.* ────────────────────
DROP POLICY IF EXISTS "causa_shares_insert" ON public.causa_shares;
CREATE POLICY "causa_shares_insert" ON public.causa_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = invited_by_user_id) AND private.user_owns_causa(causa_id)
  );

DROP POLICY IF EXISTS "causa_shares_delete" ON public.causa_shares;
CREATE POLICY "causa_shares_delete" ON public.causa_shares
  FOR DELETE TO authenticated
  USING (private.user_owns_causa(causa_id));

DROP POLICY IF EXISTS "causa_shares_no_update" ON public.causa_shares;

DROP POLICY IF EXISTS "causa_shares_select" ON public.causa_shares;
CREATE POLICY "causa_shares_select" ON public.causa_shares
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = shared_with_user_id) OR private.user_can_access_causa(causa_id)
  );

DROP POLICY IF EXISTS "causas_select" ON public.causas;
CREATE POLICY "causas_select" ON public.causas
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_id) OR private.causa_shared_with_me(id)
  );

DROP POLICY IF EXISTS "causas_update" ON public.causas;
CREATE POLICY "causas_update" ON public.causas
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = user_id) OR private.causa_shared_with_me(id)
  )
  WITH CHECK (
    (auth.uid() = user_id) OR private.causa_shared_with_me(id)
  );

-- ─── Funciones public.* que ya no usa ninguna policy ───────────
DROP FUNCTION IF EXISTS public.user_owns_causa(uuid);
DROP FUNCTION IF EXISTS public.user_can_access_causa(uuid);
DROP FUNCTION IF EXISTS public.causa_shared_with_me(uuid);

-- ─── Búsqueda de perfil por email (sin exponer el email) ───────
-- Cambia el tipo de retorno, por eso hay que hacer DROP antes del CREATE.
DROP FUNCTION IF EXISTS public.buscar_perfil_por_email(text);

CREATE FUNCTION public.buscar_perfil_por_email(p_email text)
RETURNS TABLE(id uuid, nombre_completo text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT p.id, p.nombre_completo
    FROM public.profiles p
    WHERE lower(p.email) = lower(trim(p_email))
    LIMIT 1;
END;
$function$;
