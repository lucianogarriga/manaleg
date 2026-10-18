-- ═══════════════════════════════════════════════════════════════
-- Auditoría visible para el propio admin: solo sus accesos al panel.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.mis_accesos_admin()
RETURNS TABLE (seccion TEXT, creado_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.es_admin_con_mfa() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT a.seccion, a.creado_at
    FROM public.admin_auditoria a
    WHERE a.admin_id = (select auth.uid())
    ORDER BY a.creado_at DESC
    LIMIT 50;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mis_accesos_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mis_accesos_admin() TO authenticated;
