-- Dashboard: vencidos recientes vs antiguos, y duración de causas judiciales y extrajudiciales por separado.
-- Se reescribe el cuerpo vigente de estadisticas_novedades reemplazando fragmentos exactos (falla si no coinciden).
DO $mig$
DECLARE
  cuerpo TEXT;
  viejo TEXT;
  nuevo TEXT;
BEGIN
  SELECT p.prosrc INTO cuerpo
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'estadisticas_novedades';

  -- 1) Vencidos: los últimos 30 días; los más viejos se cuentan aparte.
  viejo := $f$'vencidos', (SELECT count(*) FROM public.vencimientos WHERE tipo <> 'Audiencia' AND NOT completado AND fecha < v_hoy),$f$;
  nuevo := $f$'vencidos', (SELECT count(*) FROM public.vencimientos WHERE tipo <> 'Audiencia' AND NOT completado AND fecha < v_hoy AND fecha >= v_hoy - 30), 'vencidosAntiguos', (SELECT count(*) FROM public.vencimientos WHERE tipo <> 'Audiencia' AND NOT completado AND fecha < v_hoy - 30),$f$;
  IF position(viejo IN cuerpo) = 0 THEN RAISE EXCEPTION 'Fragmento de vencidos no encontrado'; END IF;
  cuerpo := replace(cuerpo, viejo, nuevo);

  -- 2) Duración judicial: cantidad de causas, además del desglose por fuero.
  viejo := $f$'porFuero', coalesce((SELECT jsonb_object_agg(f, m) FROM ($f$;
  nuevo := $f$'n', (SELECT count(*) FROM public.causas c3 WHERE c3.estado = 'Cerrada' AND c3.fuero IS DISTINCT FROM 'Extrajudicial' AND c3.resultado_fecha IS NOT NULL AND c3.fecha_inicio IS NOT NULL AND c3.resultado_fecha >= v_hoy - 730), 'porFuero', coalesce((SELECT jsonb_object_agg(f, m) FROM ($f$;
  IF position(viejo IN cuerpo) = 0 THEN RAISE EXCEPTION 'Fragmento de porFuero no encontrado'; END IF;
  cuerpo := replace(cuerpo, viejo, nuevo);

  -- 3) Duración extrajudicial / administrativo, por separado.
  viejo := $f$'exito', (SELECT jsonb_build_object($f$;
  nuevo := $f$'duracionMesesExtrajudicial', (SELECT jsonb_build_object('promedio', round(avg((c.resultado_fecha - c.fecha_inicio)::numeric / 30.44), 1), 'n', count(*)) FROM public.causas c WHERE c.estado = 'Cerrada' AND c.fuero = 'Extrajudicial' AND c.resultado_fecha IS NOT NULL AND c.fecha_inicio IS NOT NULL AND c.resultado_fecha >= v_hoy - 730), 'exito', (SELECT jsonb_build_object($f$;
  IF position(viejo IN cuerpo) = 0 THEN RAISE EXCEPTION 'Fragmento de exito no encontrado'; END IF;
  cuerpo := replace(cuerpo, viejo, nuevo);

  EXECUTE format(
    'CREATE OR REPLACE FUNCTION public.estadisticas_novedades(p_periodo TEXT DEFAULT ''mes'')
     RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = ''''
     AS $body$%s$body$',
    cuerpo);
END
$mig$;
