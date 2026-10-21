-- JUS: cotización en ARS que se carga con cada honorario en JUS, y valor de referencia del JUS en el perfil.
ALTER TABLE public.honorarios
  ADD COLUMN IF NOT EXISTS cotizacion_ars NUMERIC(14,2) CHECK (cotizacion_ars IS NULL OR cotizacion_ars > 0);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS jus_referencia TEXT CHECK (char_length(jus_referencia) <= 60),
  ADD COLUMN IF NOT EXISTS jus_valor NUMERIC(14,2) CHECK (jus_valor IS NULL OR jus_valor > 0),
  ADD COLUMN IF NOT EXISTS jus_valor_fecha DATE;

GRANT UPDATE (jus_referencia, jus_valor, jus_valor_fecha) ON public.profiles TO authenticated;

-- Honorarios y pagos con los montos en ARS: los JUS se convierten con su cotización.
-- Un honorario en JUS sin cotización cargada suma 0 hasta que se complete.
CREATE OR REPLACE VIEW public.honorarios_dinero WITH (security_invoker = true) AS
SELECT h.id, h.causa_id, h.anulado, h.created_at, h.fecha_pacto,
       CASE WHEN h.moneda = 'JUS' THEN 'ARS' ELSE h.moneda END AS moneda,
       h.monto_acordado * CASE WHEN h.moneda = 'JUS' THEN coalesce(h.cotizacion_ars, 0) ELSE 1 END AS monto_acordado,
       h.saldo_pendiente * CASE WHEN h.moneda = 'JUS' THEN coalesce(h.cotizacion_ars, 0) ELSE 1 END AS saldo_pendiente
FROM public.honorarios h;

CREATE OR REPLACE VIEW public.pagos_dinero WITH (security_invoker = true) AS
SELECT p.id, p.honorario_id, p.fecha_pago, p.anulado,
       p.monto * CASE WHEN h.moneda = 'JUS' THEN coalesce(h.cotizacion_ars, 0) ELSE 1 END AS monto
FROM public.pagos p
JOIN public.honorarios h ON h.id = p.honorario_id;

GRANT SELECT ON public.honorarios_dinero, public.pagos_dinero TO authenticated;

-- Indicadores del dashboard: la función vigente pasa a leer las vistas en ARS.
DO $mig$
DECLARE
  cuerpo TEXT;
BEGIN
  SELECT p.prosrc INTO cuerpo
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'estadisticas_novedades';

  cuerpo := replace(cuerpo, 'public.honorarios', 'public.honorarios_dinero');
  cuerpo := replace(cuerpo, 'public.pagos', 'public.pagos_dinero');

  EXECUTE format(
    'CREATE OR REPLACE FUNCTION public.estadisticas_novedades(p_periodo TEXT DEFAULT ''mes'')
     RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = ''''
     AS $body$%s$body$',
    cuerpo);
END
$mig$;
