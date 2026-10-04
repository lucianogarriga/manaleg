-- ═══════════════════════════════════════════════════════════════
-- Mejorar RLS de profiles: restringir enumeración de emails
-- ═══════════════════════════════════════════════════════════════
--
-- Problema previo: profiles_select USING (true) permitía que cualquier
-- usuario autenticado listara todos los emails del sistema.
--
-- Solución:
-- 1. Función SECURITY DEFINER para buscar por email al compartir causas
--    (único caso donde se necesita buscar un usuario desconocido).
-- 2. Política restrictiva: solo se ven perfiles de usuarios con quienes
--    ya se tiene relación (causas compartidas, movimientos, pagos).


-- ─── 1. Función de búsqueda por email (para compartir causas) ───
-- SECURITY DEFINER: bypassa RLS para encontrar al destinatario.
-- Solo devuelve id + nombre + email (no plan, no estado_pago, etc.).
CREATE OR REPLACE FUNCTION public.buscar_perfil_por_email(p_email TEXT)
RETURNS TABLE(id UUID, nombre_completo TEXT, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.nombre_completo, p.email
    FROM public.profiles p
    WHERE lower(p.email) = lower(trim(p_email))
    LIMIT 1;
END;
$$;

-- Solo usuarios autenticados pueden llamarla
REVOKE ALL ON FUNCTION public.buscar_perfil_por_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_perfil_por_email(TEXT) TO authenticated;


-- ─── 2. Reemplazar política permisiva por una restrictiva ───
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (
    -- Propio perfil
    id = auth.uid()

    -- Dueño o editor de causas que el usuario puede ver (propias + compartidas)
    OR id IN (
      SELECT c.user_id FROM public.causas c
      WHERE c.user_id = auth.uid()
      UNION
      SELECT c.user_id FROM public.causas c
      JOIN public.causa_shares cs ON cs.causa_id = c.id
      WHERE cs.shared_with_user_id = auth.uid()
      UNION
      SELECT c.ultimo_editor_id FROM public.causas c
      WHERE c.user_id = auth.uid() AND c.ultimo_editor_id IS NOT NULL
      UNION
      SELECT c.ultimo_editor_id FROM public.causas c
      JOIN public.causa_shares cs ON cs.causa_id = c.id
      WHERE cs.shared_with_user_id = auth.uid() AND c.ultimo_editor_id IS NOT NULL
    )

    -- Colaboradores directos (invitados por mí o que me invitaron)
    OR id IN (
      SELECT cs.shared_with_user_id FROM public.causa_shares cs
      WHERE cs.invited_by_user_id = auth.uid()
      UNION
      SELECT cs.invited_by_user_id FROM public.causa_shares cs
      WHERE cs.shared_with_user_id = auth.uid()
    )

    -- Autores de movimientos en causas que puedo ver
    OR id IN (
      SELECT m.autor_id FROM public.movimientos m
      JOIN public.causas c ON c.id = m.causa_id
      WHERE c.user_id = auth.uid()
      UNION
      SELECT m.autor_id FROM public.movimientos m
      JOIN public.causa_shares cs ON cs.causa_id = m.causa_id
      WHERE cs.shared_with_user_id = auth.uid()
    )

    -- Quienes registraron pagos en causas que puedo ver
    OR id IN (
      SELECT p2.registrado_por_id FROM public.pagos p2
      JOIN public.causas c ON c.id = p2.causa_id
      WHERE c.user_id = auth.uid()
      UNION
      SELECT p2.registrado_por_id FROM public.pagos p2
      JOIN public.causa_shares cs ON cs.causa_id = p2.causa_id
      WHERE cs.shared_with_user_id = auth.uid()
    )
  );
