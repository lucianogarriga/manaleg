-- ═══════════════════════════════════════════════════════════════
-- Anulaciones (B-3) y totales calculados en la base (B-6).
--   update_monto_cobrado: ignora los pagos anulados.
--   totales_honorarios: suma por moneda sobre los honorarios visibles
--   (RLS aplica), sin el tope de 1.000 filas de PostgREST.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_monto_cobrado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  hid UUID;
BEGIN
  FOREACH hid IN ARRAY ARRAY[OLD.honorario_id, NEW.honorario_id] LOOP
    IF hid IS NOT NULL THEN
      UPDATE public.honorarios
      SET monto_cobrado = (
        SELECT COALESCE(SUM(monto), 0) FROM public.pagos
        WHERE honorario_id = hid AND NOT anulado
      )
      WHERE id = hid;
    END IF;
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.totales_honorarios()
RETURNS TABLE(moneda TEXT, acordado NUMERIC, cobrado NUMERIC, saldo NUMERIC)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    h.moneda,
    COALESCE(SUM(CASE WHEN h.periodicidad = 'unico' THEN h.monto_acordado END), 0),
    COALESCE(SUM(h.monto_cobrado), 0),
    COALESCE(SUM(CASE WHEN h.periodicidad = 'unico' THEN h.monto_acordado - h.monto_cobrado END), 0)
  FROM public.honorarios h
  WHERE NOT h.anulado
  GROUP BY h.moneda;
$$;

REVOKE EXECUTE ON FUNCTION public.totales_honorarios() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.totales_honorarios() TO authenticated;
