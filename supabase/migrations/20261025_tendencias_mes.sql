-- ═══════════════════════════════════════════════════════════════
-- Tendencias de los últimos 6 meses (antes eran 7 semanas), para
-- comparar cada indicador con el mismo período en las barras.
-- Mismas aproximaciones que estadisticas_tendencias (ver 20261024).
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
meses AS (
  SELECT s::date AS ini, (s + INTERVAL '1 month' - INTERVAL '1 day')::date AS fin
  FROM hoy,
       generate_series(
         date_trunc('month', hoy.d) - INTERVAL '5 months',
         date_trunc('month', hoy.d),
         INTERVAL '1 month') AS s
)
SELECT jsonb_build_object(
  'causasActivas', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT count(*) FROM public.causas c
                      WHERE c.estado <> 'Cerrada'
                        AND coalesce(c.fecha_inicio, c.created_at::date) <= sm.fin) AS v
      FROM meses sm) q),
  'vencimientos', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT count(*) FROM public.vencimientos x
                      WHERE x.fecha BETWEEN sm.ini AND sm.fin) AS v
      FROM meses sm) q),
  'inactivas', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT count(*) FROM public.causas c
                      WHERE c.estado <> 'Cerrada'
                        AND coalesce(c.fecha_inicio, c.created_at::date) <= sm.fin
                        AND coalesce(c.fecha_ultimo_movimiento, c.fecha_inicio, c.created_at::date) < sm.fin - 30) AS v
      FROM meses sm) q),
  'cobrado', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT coalesce(round(sum(p.monto), 2), 0)
                      FROM public.pagos p JOIN public.honorarios h ON h.id = p.honorario_id
                      WHERE NOT p.anulado AND NOT h.anulado AND h.moneda = 'ARS'
                        AND p.fecha_pago BETWEEN sm.ini AND sm.fin) AS v
      FROM meses sm) q),
  'pendientePeriodo', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT coalesce(round(sum(h.saldo_pendiente), 2), 0)
                      FROM public.honorarios h
                      WHERE NOT h.anulado AND h.moneda = 'ARS'
                        AND coalesce(h.fecha_pacto, h.created_at::date) BETWEEN sm.ini AND sm.fin) AS v
      FROM meses sm) q),
  'pendienteTotal', (SELECT coalesce(jsonb_agg(v ORDER BY ini), '[]'::jsonb) FROM (
      SELECT sm.ini, (SELECT coalesce(round(sum(h.saldo_pendiente), 2), 0)
                      FROM public.honorarios h
                      WHERE NOT h.anulado AND h.moneda = 'ARS'
                        AND coalesce(h.fecha_pacto, h.created_at::date) <= sm.fin) AS v
      FROM meses sm) q)
);
$$;

GRANT EXECUTE ON FUNCTION public.estadisticas_tendencias() TO authenticated;
