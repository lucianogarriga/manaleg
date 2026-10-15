-- ═══════════════════════════════════════════════════════════════
-- Estadísticas del dashboard calculadas en la base (B-6).
-- Antes se traían filas completas y PostgREST cortaba en 1.000.
-- Honorarios cobrados separados por moneda; pagos anulados excluidos.
-- SECURITY INVOKER: cada usuario ve solo lo que RLS le permite.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.estadisticas_dashboard()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
WITH k AS (
  SELECT
    x.hoy,
    ((x.hoy - 30)::text || 'T00:00:00Z')::timestamptz AS h30,
    ((x.hoy - 60)::text || 'T00:00:00Z')::timestamptz AS h60,
    x.hoy + 7  AS en7,
    x.hoy + 30 AS en30
  FROM (SELECT (now() AT TIME ZONE 'America/Argentina/Cordoba')::date AS hoy) x
),
causas_recientes AS (
  SELECT (k.hoy - (c.created_at AT TIME ZONE 'America/Argentina/Cordoba')::date) AS dias
  FROM public.causas c
  CROSS JOIN k
  WHERE c.created_at >= k.h60
),
sparkline AS (
  SELECT g.i, COALESCE(s.n, 0) AS n
  FROM generate_series(0, 5) AS g(i)
  LEFT JOIN (
    SELECT 5 - LEAST(5, dias / 7) AS i, count(*) AS n
    FROM causas_recientes
    WHERE dias <= 42
    GROUP BY 1
  ) s ON s.i = g.i
),
honorarios_cobrados AS (
  SELECT
    h.moneda,
    COALESCE(SUM(p.monto) FILTER (WHERE p.fecha_pago >= k.hoy - 30), 0) AS este30,
    COALESCE(SUM(p.monto) FILTER (WHERE p.fecha_pago >= k.hoy - 60 AND p.fecha_pago < k.hoy - 30), 0) AS prev30
  FROM public.pagos p
  JOIN public.honorarios h ON h.id = p.honorario_id
  CROSS JOIN k
  WHERE NOT p.anulado AND p.fecha_pago >= k.hoy - 60
  GROUP BY h.moneda
)
SELECT jsonb_build_object(
  'causasActivas', (SELECT count(*) FROM public.causas WHERE estado <> 'Cerrada'),
  'causasNuevasEste30', (SELECT count(*) FROM causas_recientes WHERE dias <= 30),
  'causasNuevasPrev30', (SELECT count(*) FROM causas_recientes WHERE dias > 30),
  'causasSparkline', (SELECT jsonb_agg(n ORDER BY i) FROM sparkline),
  'clientesTotal', (SELECT count(*) FROM public.clientes),
  'clientesNuevosEste30', (SELECT count(*) FROM public.clientes, k WHERE clientes.created_at >= k.h30),
  'clientesNuevosPrev30', (SELECT count(*) FROM public.clientes, k WHERE clientes.created_at >= k.h60 AND clientes.created_at < k.h30),
  'vencimientosProx7', (SELECT count(*) FROM public.causas, k
    WHERE estado <> 'Cerrada' AND proximo_vencimiento >= k.hoy AND proximo_vencimiento <= k.en7),
  'vencidosTotal', (SELECT count(*) FROM public.causas, k
    WHERE estado <> 'Cerrada' AND proximo_vencimiento < k.hoy),
  'audienciasProx30', (SELECT count(*) FROM public.eventos, k
    WHERE tipo = 'Audiencia' AND fecha >= k.hoy AND fecha <= k.en30),
  'honorariosCobrados', (SELECT COALESCE(jsonb_object_agg(moneda, jsonb_build_object('este30', este30, 'prev30', prev30)), '{}'::jsonb)
    FROM honorarios_cobrados)
);
$$;

REVOKE EXECUTE ON FUNCTION public.estadisticas_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.estadisticas_dashboard() TO authenticated;
