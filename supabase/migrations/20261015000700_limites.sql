-- ═══════════════════════════════════════════════════════════════
-- Límites de intentos (S-6). Contador por clave en ventana de tiempo.
-- La tabla no es accesible desde el navegador: solo la función.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.limites (
  clave           TEXT PRIMARY KEY,
  ventana_inicio  TIMESTAMPTZ NOT NULL,
  cuenta          INTEGER NOT NULL
);

ALTER TABLE public.limites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.limites FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consumir_limite(p_clave TEXT, p_max INTEGER, p_ventana_seg INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cuenta INTEGER;
BEGIN
  INSERT INTO public.limites AS l (clave, ventana_inicio, cuenta)
  VALUES (p_clave, now(), 1)
  ON CONFLICT (clave) DO UPDATE SET
    ventana_inicio = CASE WHEN l.ventana_inicio < now() - make_interval(secs => p_ventana_seg) THEN now() ELSE l.ventana_inicio END,
    cuenta         = CASE WHEN l.ventana_inicio < now() - make_interval(secs => p_ventana_seg) THEN 1 ELSE l.cuenta + 1 END
  RETURNING cuenta INTO v_cuenta;

  RETURN v_cuenta <= p_max;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consumir_limite(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consumir_limite(TEXT, INTEGER, INTEGER) TO anon, authenticated;
