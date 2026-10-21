-- Monedas judiciales por usuario (JUS, UMA, otras). Cada honorario guarda el nombre y la cotización usados al cargarlo.
CREATE TABLE IF NOT EXISTS public.monedas_judiciales (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 30),
  referencia   TEXT CHECK (char_length(referencia) <= 60),
  valor        NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  valor_fecha  DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Argentina/Cordoba')::date,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, nombre)
);

ALTER TABLE public.monedas_judiciales ENABLE ROW LEVEL SECURITY;

CREATE POLICY monedas_judiciales_propias ON public.monedas_judiciales
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monedas_judiciales TO authenticated;

-- Traspaso del valor único que estaba en el perfil.
INSERT INTO public.monedas_judiciales (user_id, nombre, referencia, valor, valor_fecha)
SELECT p.id, 'JUS', coalesce(p.jus_referencia, 'Córdoba'), p.jus_valor,
       coalesce(p.jus_valor_fecha, (now() AT TIME ZONE 'America/Argentina/Cordoba')::date)
FROM public.profiles p
WHERE p.jus_valor IS NOT NULL
ON CONFLICT (user_id, nombre) DO NOTHING;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS jus_referencia,
  DROP COLUMN IF EXISTS jus_valor,
  DROP COLUMN IF EXISTS jus_valor_fecha;

-- Honorarios: nombre de la moneda judicial usada (moneda = 'JUS' para cualquier moneda judicial).
-- Los honorarios JUS anteriores quedan sin nombre y se muestran como JUS: no se modifican filas de honorarios aquí.
ALTER TABLE public.honorarios ADD COLUMN IF NOT EXISTS moneda_judicial_nombre TEXT;

-- Totales por moneda: las judiciales se separan por su nombre (JUS, UMA, etc.).
CREATE OR REPLACE FUNCTION public.totales_honorarios()
RETURNS TABLE(moneda TEXT, acordado NUMERIC, cobrado NUMERIC, saldo NUMERIC)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    CASE WHEN h.moneda = 'JUS' THEN coalesce(h.moneda_judicial_nombre, 'JUS') ELSE h.moneda END,
    COALESCE(SUM(CASE WHEN h.periodicidad = 'unico' THEN h.monto_acordado END), 0),
    COALESCE(SUM(h.monto_cobrado), 0),
    COALESCE(SUM(CASE WHEN h.periodicidad = 'unico' THEN h.monto_acordado - h.monto_cobrado END), 0)
  FROM public.honorarios h
  WHERE NOT h.anulado
  GROUP BY 1;
$$;

REVOKE EXECUTE ON FUNCTION public.totales_honorarios() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.totales_honorarios() TO authenticated;
