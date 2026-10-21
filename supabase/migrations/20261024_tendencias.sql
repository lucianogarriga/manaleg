-- ═══════════════════════════════════════════════════════════════
-- Tendencias semanales (últimas 7 semanas) para las barras de los
-- indicadores principales del dashboard.
-- Aproximaciones, porque la base no guarda el historial de estados:
--   · causasActivas: causas abiertas hasta cada semana (no contempla cierres pasados).
--   · inactivas: causas sin movimiento 30 días antes del cierre de cada semana.
--   · pendiente y facturación: el saldo actual de los honorarios por semana del pacto.
-- Dinero solo en ARS. SECURITY INVOKER: RLS limita lo que ve cada usuario.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.estadisticas_tendencias()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
WITH hoy AS (
  SELECT (now() AT TIME ZONE 'America/Argentina/Cordoba')::date AS d
),
semanas AS (
  SELECT s::date AS ini, (s + INTERVAL '6 days')::date AS fin
  FROM hoy,
       generate_series(
         date_trunc('week', hoy.d) - INTERVAL '6 weeks',
         date_trunc('week', hoy.d),
         INTERVAL '1 week') AS s
)
SELECT jsonb_build_object(
  'causasActivas', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT count(*) FROM public.causas c
                      WHERE c.estado <> 'Cerrada'
                        AND coalesce(c.fecha_inicio, c.created_at::date) <= sm.fin) AS v
      FROM semanas sm) q),
  'vencimientos', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT count(*) FROM public.vencimientos x
                      WHERE x.fecha BETWEEN sm.ini AND sm.fin) AS v
      FROM semanas sm) q),
  'inactivas', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT count(*) FROM public.causas c
                      WHERE c.estado <> 'Cerrada'
                        AND coalesce(c.fecha_inicio, c.created_at::date) <= sm.fin
                        AND coalesce(c.fecha_ultimo_movimiento, c.fecha_inicio, c.created_at::date) < sm.fin - 30) AS v
      FROM semanas sm) q),
  'cobrado', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT coalesce(round(sum(p.monto), 2), 0)
                      FROM public.pagos p JOIN public.honorarios h ON h.id = p.honorario_id
                      WHERE NOT p.anulado AND NOT h.anulado AND h.moneda = 'ARS'
                        AND p.fecha_pago BETWEEN sm.ini AND sm.fin) AS v
      FROM semanas sm) q),
  'pendientePeriodo', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT coalesce(round(sum(h.saldo_pendiente), 2), 0)
                      FROM public.honorarios h
                      WHERE NOT h.anulado AND h.moneda = 'ARS'
                        AND coalesce(h.fecha_pacto, h.created_at::date) BETWEEN sm.ini AND sm.fin) AS v
      FROM semanas sm) q),
  'pendienteTotal', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT coalesce(round(sum(h.saldo_pendiente), 2), 0)
                      FROM public.honorarios h
                      WHERE NOT h.anulado AND h.moneda = 'ARS'
                        AND coalesce(h.fecha_pacto, h.created_at::date) <= sm.fin) AS v
      FROM semanas sm) q)
);
$$;

GRANT EXECUTE ON FUNCTION public.estadisticas_tendencias() TO authenticated;
