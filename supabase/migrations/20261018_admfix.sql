-- ═══════════════════════════════════════════════════════════════
-- Corrige admin_metricas: vencimientos usa la columna "tipo" y los
-- recordatorios viven en causas.tipo_vencimiento.
-- ═══════════════════════════════════════════════════════════════

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
                       FROM public.vencimientos v JOIN public.causas c ON c.id = v.causa_id),
      'recordatorios', (SELECT jsonb_build_object('registros', count(*), 'usuarios', count(DISTINCT c.user_id))
                        FROM public.causas c
                        WHERE c.tipo_vencimiento = 'Recordatorio'),
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
