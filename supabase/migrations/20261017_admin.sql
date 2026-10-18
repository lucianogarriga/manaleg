-- ═══════════════════════════════════════════════════════════════
-- Panel de super admin (fase 1: solo lectura, sin datos personales).
--   · es_admin: solo se asigna desde el panel de Supabase (service role).
--   · ultima_actividad: se usa solo para contar usuarios "en línea".
--   · admin_metricas(): devuelve conteos y promedios, nunca filas de usuarios.
--   · Todo acceso al panel queda en admin_auditoria.
--   · Requiere MFA (aal2) además de es_admin.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS es_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ultima_actividad TIMESTAMPTZ;

-- El usuario no puede modificar estas columnas (no están en los GRANT de profiles).
REVOKE UPDATE (es_admin, ultima_actividad) ON public.profiles FROM anon, authenticated;

-- Segunda barrera: nadie que no sea el rol de servicio o el dueño de la base puede cambiar es_admin.
CREATE OR REPLACE FUNCTION public.proteger_es_admin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.es_admin IS DISTINCT FROM OLD.es_admin
     AND (select auth.role()) IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'No se puede modificar es_admin desde la aplicación.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_proteger_es_admin ON public.profiles;
CREATE TRIGGER profiles_proteger_es_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_es_admin();

-- Heartbeat: marca actividad como máximo cada 2 minutos.
CREATE OR REPLACE FUNCTION public.registrar_actividad()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.profiles
  SET ultima_actividad = now()
  WHERE id = (select auth.uid())
    AND (ultima_actividad IS NULL OR ultima_actividad < now() - interval '2 minutes');
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_actividad() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_actividad() TO authenticated;

-- Autorización del panel: admin + sesión con MFA verificado (aal2).
CREATE OR REPLACE FUNCTION private.es_admin_con_mfa()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce((SELECT p.es_admin FROM public.profiles p WHERE p.id = (select auth.uid())), false)
     AND coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

REVOKE EXECUTE ON FUNCTION private.es_admin_con_mfa() FROM PUBLIC, anon;

-- Auditoría de accesos al panel. Nadie la lee ni la escribe desde el navegador.
CREATE TABLE IF NOT EXISTS public.admin_auditoria (
  id          BIGSERIAL PRIMARY KEY,
  admin_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seccion     TEXT NOT NULL CHECK (char_length(seccion) BETWEEN 1 AND 50),
  creado_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_auditoria ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_auditoria FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_acceso_admin(p_seccion TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.es_admin_con_mfa() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.admin_auditoria (admin_id, seccion)
  VALUES ((select auth.uid()), left(p_seccion, 50));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_acceso_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_acceso_admin(TEXT) TO authenticated;

-- Métricas agregadas. Solo devuelve conteos, promedios y medianas.
CREATE OR REPLACE FUNCTION public.admin_metricas()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r jsonb;
BEGIN
  IF NOT private.es_admin_con_mfa() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'usuarios', jsonb_build_object(
      'total', (SELECT count(*) FROM public.profiles),
      'nuevos7', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '7 days'),
      'nuevos30', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '30 days'),
      'enLinea', (SELECT count(*) FROM public.profiles WHERE ultima_actividad >= now() - interval '5 minutes'),
      'activos30', (SELECT count(*) FROM public.profiles WHERE ultima_actividad >= now() - interval '30 days'),
      'porPlan', (SELECT coalesce(jsonb_object_agg(plan, n), '{}'::jsonb)
                  FROM (SELECT plan, count(*) AS n FROM public.profiles GROUP BY plan) x),
      'porEstadoPago', (SELECT coalesce(jsonb_object_agg(estado_pago, n), '{}'::jsonb)
                        FROM (SELECT estado_pago, count(*) AS n FROM public.profiles GROUP BY estado_pago) x)
    ),
    'causas', jsonb_build_object(
      'total', (SELECT count(*) FROM public.causas),
      'porEstado', (SELECT coalesce(jsonb_object_agg(estado, n), '{}'::jsonb)
                    FROM (SELECT estado, count(*) AS n FROM public.causas GROUP BY estado) x),
      'promedioPorUsuario', (SELECT round(avg(n), 1) FROM (SELECT count(*) AS n FROM public.causas GROUP BY user_id) x),
      'medianaPorUsuario', (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY n) FROM (SELECT count(*) AS n FROM public.causas GROUP BY user_id) x)
    ),
    'uso', jsonb_build_object(
      'agenda', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT user_id)) FROM public.eventos),
      'vencimientos', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT c.user_id))
                       FROM public.vencimientos v JOIN public.causas c ON c.id = v.causa_id
                       WHERE v.tipo_vencimiento IS DISTINCT FROM 'Recordatorio'),
      'recordatorios', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT c.user_id))
                        FROM public.vencimientos v JOIN public.causas c ON c.id = v.causa_id
                        WHERE v.tipo_vencimiento = 'Recordatorio'),
      'movimientos', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT c.user_id))
                      FROM public.movimientos m JOIN public.causas c ON c.id = m.causa_id),
      'clientes', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT user_id)) FROM public.clientes),
      'honorarios', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT c.user_id))
                     FROM public.honorarios h JOIN public.causas c ON c.id = h.causa_id),
      'pagos', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT c.user_id))
                FROM public.pagos p JOIN public.causas c ON c.id = p.causa_id),
      'gastos', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT user_id)) FROM public.gastos),
      'tareas', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT user_id)) FROM public.todos),
      'partes', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT c.user_id))
                 FROM public.causa_partes cp JOIN public.causas c ON c.id = cp.causa_id),
      'compartidas', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT cs.invited_by_user_id))
                      FROM public.causa_shares cs)
    ),
    'registrosPorSemana', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('semana', s.semana, 'registros', coalesce(p.n, 0)) ORDER BY s.semana), '[]'::jsonb)
      FROM (SELECT generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') AS semana) s
      LEFT JOIN (SELECT date_trunc('week', created_at) AS semana, count(*) AS n FROM public.profiles GROUP BY 1) p
        ON p.semana = s.semana
    )
  ) INTO r;

  RETURN r;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_metricas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_metricas() TO authenticated;
