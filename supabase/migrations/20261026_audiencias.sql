-- ═══════════════════════════════════════════════════════════════
-- Audiencias: se leen de vencimientos (tipo 'Audiencia'), que es donde
-- las carga la app. Se agrega el estado de cada audiencia y se separan
-- las audiencias de los vencimientos en los indicadores.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.vencimientos
  ADD COLUMN IF NOT EXISTS estado_audiencia TEXT
    CHECK (estado_audiencia IN ('Programada', 'Celebrada', 'Suspendida', 'Reprogramada'));

-- ═══════════════════════════════════════════════════════════════
-- Indicadores de Novedades y KPIs del dashboard, calculados en la base.
--   · Dinero siempre separado por moneda (ARS / USD). Los gastos no tienen
--     moneda: se suman como ARS.
--   · SECURITY INVOKER: cada usuario ve solo lo que RLS le permite.
--   · Período: mes (calendario), trim (últimos 3 meses), anio (año a la fecha).
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.estadisticas_novedades(p_periodo TEXT DEFAULT 'mes')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_hoy        DATE := (now() AT TIME ZONE 'America/Argentina/Cordoba')::date;
  v_desde      DATE;
  v_prev_desde DATE;
  v_prev_hasta DATE;
  r            jsonb;
BEGIN
  IF p_periodo NOT IN ('mes', 'trim', 'anio') THEN
    RAISE EXCEPTION 'Período inválido' USING ERRCODE = '22023';
  END IF;

  IF p_periodo = 'mes' THEN
    v_desde := date_trunc('month', v_hoy)::date;
    v_prev_desde := (v_desde - INTERVAL '1 month')::date;
    v_prev_hasta := v_desde - 1;
  ELSIF p_periodo = 'trim' THEN
    v_desde := (date_trunc('month', v_hoy) - INTERVAL '2 months')::date;
    v_prev_desde := (v_desde - INTERVAL '3 months')::date;
    v_prev_hasta := v_desde - 1;
  ELSE
    v_desde := date_trunc('year', v_hoy)::date;
    v_prev_desde := (v_desde - INTERVAL '1 year')::date;
    v_prev_hasta := (v_hoy - INTERVAL '1 year')::date;
  END IF;

  SELECT jsonb_build_object(
    'periodo', jsonb_build_object('desde', v_desde, 'hasta', v_hoy,
                                  'prevDesde', v_prev_desde, 'prevHasta', v_prev_hasta),

    -- ── Cartera ──
    'causas', jsonb_build_object(
      'total', (SELECT count(*) FROM public.causas),
      'activas', (SELECT count(*) FROM public.causas WHERE estado <> 'Cerrada'),
      'judiciales', (SELECT count(*) FROM public.causas WHERE estado <> 'Cerrada' AND coalesce(fuero, '') <> 'Extrajudicial'),
      'extrajudiciales', (SELECT count(*) FROM public.causas WHERE estado <> 'Cerrada' AND fuero = 'Extrajudicial'),
      'cerradas', (SELECT count(*) FROM public.causas WHERE estado = 'Cerrada'),
      'activasPorEstado', (SELECT coalesce(jsonb_object_agg(estado, n), '{}'::jsonb)
                           FROM (SELECT estado, count(*) AS n FROM public.causas WHERE estado <> 'Cerrada' GROUP BY estado) x),
      'activasPorFuero', (SELECT coalesce(jsonb_object_agg(f, n), '{}'::jsonb)
                          FROM (SELECT coalesce(fuero, 'Sin fuero') AS f, count(*) AS n
                                FROM public.causas WHERE estado <> 'Cerrada' GROUP BY 1) x),
      'activasPorEtapa', (SELECT coalesce(jsonb_object_agg(e, n), '{}'::jsonb)
                          FROM (SELECT coalesce(etapa_procesal, 'Sin definir') AS e, count(*) AS n
                                FROM public.causas WHERE estado <> 'Cerrada' GROUP BY 1) x),
      'nuevasMes', (SELECT count(*) FROM public.causas
                    WHERE coalesce(fecha_inicio, created_at::date) BETWEEN date_trunc('month', v_hoy)::date AND v_hoy),
      'nuevasMesPrev', (SELECT count(*) FROM public.causas
                        WHERE coalesce(fecha_inicio, created_at::date)
                              BETWEEN (date_trunc('month', v_hoy) - INTERVAL '1 month')::date
                                  AND (date_trunc('month', v_hoy) - INTERVAL '1 day')::date),
      'nuevasPeriodo', (SELECT count(*) FROM public.causas
                        WHERE coalesce(fecha_inicio, created_at::date) BETWEEN v_desde AND v_hoy),
      'nuevasPeriodoPrev', (SELECT count(*) FROM public.causas
                            WHERE coalesce(fecha_inicio, created_at::date) BETWEEN v_prev_desde AND v_prev_hasta),
      'inactivas30', (SELECT count(*) FROM public.causas
                      WHERE estado <> 'Cerrada'
                        AND coalesce(fecha_ultimo_movimiento, fecha_inicio, created_at::date) < v_hoy - 30),
      'nuevasSeisMeses', (SELECT coalesce(jsonb_agg(jsonb_build_object('mes', m.mes, 'n', coalesce(c.n, 0))
                                                    ORDER BY m.mes), '[]'::jsonb)
                          FROM (SELECT generate_series(date_trunc('month', v_hoy) - INTERVAL '5 months',
                                                       date_trunc('month', v_hoy), INTERVAL '1 month')::date AS mes) m
                          LEFT JOIN (SELECT date_trunc('month', coalesce(fecha_inicio, created_at::date))::date AS mes,
                                            count(*) AS n
                                     FROM public.causas GROUP BY 1) c ON c.mes = m.mes)
    ),

    -- ── Vencimientos y agenda ──
    'vencimientos', jsonb_build_object(
      'vencidos', (SELECT count(*) FROM public.vencimientos WHERE tipo <> 'Audiencia' AND NOT completado AND fecha < v_hoy),
      'urgentes', (SELECT count(*) FROM public.vencimientos WHERE tipo <> 'Audiencia' AND NOT completado AND fecha BETWEEN v_hoy AND v_hoy + 3),
      'proximos', (SELECT count(*) FROM public.vencimientos WHERE tipo <> 'Audiencia' AND NOT completado AND fecha BETWEEN v_hoy + 4 AND v_hoy + 7),
      'hoy', (SELECT count(*) FROM public.vencimientos WHERE tipo <> 'Audiencia' AND NOT completado AND fecha = v_hoy)
    ),
    'audiencias', jsonb_build_object(
      'hoy', (SELECT count(*) FROM public.vencimientos WHERE tipo = 'Audiencia' AND fecha = v_hoy),
      'semana', (SELECT count(*) FROM public.vencimientos WHERE tipo = 'Audiencia' AND fecha BETWEEN v_hoy AND v_hoy + 6),
      'proximos14', (SELECT count(*) FROM public.vencimientos WHERE tipo = 'Audiencia' AND fecha BETWEEN v_hoy AND v_hoy + 14),
      'mes', (SELECT count(*) FROM public.vencimientos
              WHERE tipo = 'Audiencia'
                AND fecha BETWEEN date_trunc('month', v_hoy)::date
                              AND (date_trunc('month', v_hoy) + INTERVAL '1 month - 1 day')::date),
      'suspendidasMes', (SELECT count(*) FROM public.vencimientos
              WHERE tipo = 'Audiencia' AND estado_audiencia IN ('Suspendida', 'Reprogramada')
                AND fecha BETWEEN date_trunc('month', v_hoy)::date
                              AND (date_trunc('month', v_hoy) + INTERVAL '1 month - 1 day')::date)
    ),
    'tareas', jsonb_build_object(
      'hoy', (SELECT count(*) FROM public.todos WHERE estado <> 'Completado' AND fecha_limite = v_hoy),
      'vencidas', (SELECT count(*) FROM public.todos WHERE estado <> 'Completado' AND fecha_limite < v_hoy)
    ),

    -- ── Financiero (honorarios y pagos, por moneda) ──
    'financiero', jsonb_build_object(
      'cobrado', (SELECT coalesce(jsonb_object_agg(moneda, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, round(sum(p.monto), 2) AS t
                    FROM public.pagos p JOIN public.honorarios h ON h.id = p.honorario_id
                    WHERE NOT p.anulado AND NOT h.anulado AND p.fecha_pago BETWEEN v_desde AND v_hoy
                    GROUP BY h.moneda) x),
      'cobradoPrev', (SELECT coalesce(jsonb_object_agg(moneda, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, round(sum(p.monto), 2) AS t
                    FROM public.pagos p JOIN public.honorarios h ON h.id = p.honorario_id
                    WHERE NOT p.anulado AND NOT h.anulado AND p.fecha_pago BETWEEN v_prev_desde AND v_prev_hasta
                    GROUP BY h.moneda) x),
      'facturado', (SELECT coalesce(jsonb_object_agg(moneda, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, round(sum(h.monto_acordado), 2) AS t
                    FROM public.honorarios h
                    WHERE NOT h.anulado AND coalesce(h.fecha_pacto, h.created_at::date) BETWEEN v_desde AND v_hoy
                    GROUP BY h.moneda) x),
      'facturadoPrev', (SELECT coalesce(jsonb_object_agg(moneda, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, round(sum(h.monto_acordado), 2) AS t
                    FROM public.honorarios h
                    WHERE NOT h.anulado AND coalesce(h.fecha_pacto, h.created_at::date) BETWEEN v_prev_desde AND v_prev_hasta
                    GROUP BY h.moneda) x),
      'pendientePeriodo', (SELECT coalesce(jsonb_object_agg(moneda, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, round(sum(h.saldo_pendiente), 2) AS t
                    FROM public.honorarios h
                    WHERE NOT h.anulado AND coalesce(h.fecha_pacto, h.created_at::date) BETWEEN v_desde AND v_hoy
                    GROUP BY h.moneda) x),
      'pendienteTotal', (SELECT coalesce(jsonb_object_agg(moneda, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, round(sum(h.saldo_pendiente), 2) AS t
                    FROM public.honorarios h WHERE NOT h.anulado GROUP BY h.moneda) x),
      'pendienteCausasTotal', (SELECT count(DISTINCT h.causa_id) FROM public.honorarios h
                               WHERE NOT h.anulado AND h.saldo_pendiente > 0),
      'antiguedad', (SELECT coalesce(jsonb_object_agg(moneda, b), '{}'::jsonb) FROM (
                    SELECT moneda, jsonb_build_object(
                      'd0_30',  coalesce(sum(saldo_pendiente) FILTER (WHERE dias <= 30), 0),
                      'd31_60', coalesce(sum(saldo_pendiente) FILTER (WHERE dias BETWEEN 31 AND 60), 0),
                      'd60',    coalesce(sum(saldo_pendiente) FILTER (WHERE dias > 60), 0)) AS b
                    FROM (SELECT h.moneda, h.saldo_pendiente,
                                 (v_hoy - coalesce(h.fecha_pacto, h.created_at::date)) AS dias
                          FROM public.honorarios h
                          WHERE NOT h.anulado AND h.saldo_pendiente > 0) x
                    GROUP BY moneda) y),
      'acordadoTodas', (SELECT coalesce(jsonb_object_agg(moneda, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, round(sum(h.monto_acordado), 2) AS t
                    FROM public.honorarios h WHERE NOT h.anulado GROUP BY h.moneda) x),
      'acordadoActivas', (SELECT coalesce(jsonb_object_agg(moneda, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, round(sum(h.monto_acordado), 2) AS t
                    FROM public.honorarios h JOIN public.causas c ON c.id = h.causa_id
                    WHERE NOT h.anulado AND c.estado <> 'Cerrada' GROUP BY h.moneda) x),
      'facturacionPorFuero', (SELECT coalesce(jsonb_object_agg(moneda || '|' || f, t), '{}'::jsonb) FROM (
                    SELECT h.moneda, coalesce(c.fuero, 'Sin fuero') AS f, round(sum(h.monto_acordado), 2) AS t
                    FROM public.honorarios h JOIN public.causas c ON c.id = h.causa_id
                    WHERE NOT h.anulado AND coalesce(h.fecha_pacto, h.created_at::date) BETWEEN v_desde AND v_hoy
                    GROUP BY h.moneda, coalesce(c.fuero, 'Sin fuero')) x),
      'seisMeses', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                      'mes', m.mes,
                      'cobrado', coalesce(cb.t, '{}'::jsonb),
                      'pendiente', coalesce(pd.t, '{}'::jsonb)) ORDER BY m.mes), '[]'::jsonb)
                    FROM (SELECT generate_series(date_trunc('month', v_hoy) - INTERVAL '5 months',
                                                 date_trunc('month', v_hoy), INTERVAL '1 month')::date AS mes) m
                    LEFT JOIN LATERAL (
                      SELECT jsonb_object_agg(x.moneda, x.t) AS t FROM (
                        SELECT h.moneda, round(sum(p.monto), 2) AS t
                        FROM public.pagos p JOIN public.honorarios h ON h.id = p.honorario_id
                        WHERE NOT p.anulado AND NOT h.anulado
                          AND date_trunc('month', p.fecha_pago) = m.mes
                        GROUP BY h.moneda) x) cb ON true
                    LEFT JOIN LATERAL (
                      SELECT jsonb_object_agg(x.moneda, x.t) AS t FROM (
                        SELECT h.moneda, round(sum(h.saldo_pendiente), 2) AS t
                        FROM public.honorarios h
                        WHERE NOT h.anulado
                          AND date_trunc('month', coalesce(h.fecha_pacto, h.created_at::date)) = m.mes
                        GROUP BY h.moneda) x) pd ON true)
    ),

    -- ── Gestión ──
    'gestion', jsonb_build_object(
      'plazosTotal90', (SELECT count(*) FROM public.vencimientos
                        WHERE tipo <> 'Audiencia' AND fecha BETWEEN v_hoy - 90 AND v_hoy
                          AND NOT (completado AND completado_at IS NULL)),
      'plazosATiempo90', (SELECT count(*) FROM public.vencimientos
                          WHERE tipo <> 'Audiencia' AND fecha BETWEEN v_hoy - 90 AND v_hoy
                            AND completado AND completado_at IS NOT NULL
                            AND completado_at::date <= fecha),
      'plazosVencidosSinCumplir90', (SELECT count(*) FROM public.vencimientos
                                     WHERE tipo <> 'Audiencia' AND fecha BETWEEN v_hoy - 90 AND v_hoy - 1 AND NOT completado),
      'gastosSinReintegrar', (SELECT jsonb_build_object(
                               'monto', coalesce(round(sum(monto), 2), 0),
                               'causas', count(DISTINCT causa_id),
                               'peritajes', coalesce(round(sum(monto) FILTER (WHERE tipo = 'Pericial'), 2), 0))
                             FROM public.gastos WHERE NOT reintegrado),
      'diasPorEtapa', (SELECT coalesce(jsonb_object_agg(etapa, d), '{}'::jsonb) FROM (
                         SELECT etapa, round(avg(hasta - desde), 0) AS d
                         FROM public.causa_etapas
                         WHERE hasta IS NOT NULL AND hasta >= v_hoy - 730
                         GROUP BY etapa) x),
      'duracionMesesJudicial', (SELECT jsonb_build_object(
                         'promedio', round(avg((c.resultado_fecha - c.fecha_inicio)::numeric / 30.44), 1),
                         'porFuero', coalesce((SELECT jsonb_object_agg(f, m) FROM (
                             SELECT c2.fuero AS f, round(avg((c2.resultado_fecha - c2.fecha_inicio)::numeric / 30.44), 1) AS m
                             FROM public.causas c2
                             WHERE c2.estado = 'Cerrada' AND c2.fuero IS NOT NULL AND c2.fuero <> 'Extrajudicial'
                               AND c2.resultado_fecha IS NOT NULL AND c2.fecha_inicio IS NOT NULL
                               AND c2.resultado_fecha >= v_hoy - 730
                             GROUP BY c2.fuero) z), '{}'::jsonb))
                         FROM public.causas c
                         WHERE c.estado = 'Cerrada' AND c.fuero IS DISTINCT FROM 'Extrajudicial'
                           AND c.resultado_fecha IS NOT NULL AND c.fecha_inicio IS NOT NULL
                           AND c.resultado_fecha >= v_hoy - 730),
      'exito', (SELECT jsonb_build_object(
                  'total', count(*),
                  'ganadas', count(*) FILTER (WHERE resultado = 'Ganada'),
                  'transadas', count(*) FILTER (WHERE resultado = 'Transada'),
                  'perdidas', count(*) FILTER (WHERE resultado = 'Perdida'))
                FROM public.causas
                WHERE estado = 'Cerrada' AND resultado IS NOT NULL
                  AND resultado_fecha >= v_hoy - 730)
    ),

    -- ── Clientes ──
    'clientes', jsonb_build_object(
      'total', (SELECT count(*) FROM public.clientes),
      'activos', (SELECT count(DISTINCT cliente_id) FROM public.causas
                  WHERE estado <> 'Cerrada' AND cliente_id IS NOT NULL),
      'conSaldo', (SELECT count(DISTINCT c.cliente_id) FROM public.causas c
                   JOIN public.honorarios h ON h.causa_id = c.id
                   WHERE c.cliente_id IS NOT NULL AND NOT h.anulado AND h.saldo_pendiente > 0)
    )
  ) INTO r;

  RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.estadisticas_novedades(TEXT) TO authenticated;
