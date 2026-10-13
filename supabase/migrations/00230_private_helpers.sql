-- ═══════════════════════════════════════════════════════════════
-- Esquema private: helpers de acceso usados por las policies RLS
-- (desde 0024 en adelante).
--
-- En producción estas funciones existían sin estar versionadas en el repo.
-- Esta migración las define de forma idempotente (CREATE OR REPLACE) para que
-- un proyecto nuevo (staging) pueda construirse desde las migraciones.
-- Sobre producción no cambia nada: las definiciones y los permisos son los mismos.
-- ═══════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.user_can_access_causa(causa_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.causas
    WHERE id = causa_uuid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.causa_shares
    WHERE causa_id = causa_uuid AND shared_with_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private.user_owns_causa(causa_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.causas
    WHERE id = causa_uuid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private.causa_shared_with_me(causa_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.causa_shares
    WHERE causa_id = causa_uuid AND shared_with_user_id = auth.uid()
  );
$$;

-- Permisos: nadie sin sesión; solo usuarios autenticados y service_role.
REVOKE ALL ON FUNCTION private.user_can_access_causa(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.user_owns_causa(uuid)       FROM PUBLIC;
REVOKE ALL ON FUNCTION private.causa_shared_with_me(uuid)  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.user_can_access_causa(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_owns_causa(uuid)       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.causa_shared_with_me(uuid)  TO authenticated, service_role;
