-- ═══════════════════════════════════════════════════════════════
-- Tope de 50 pagos y 50 gastos por causa (igual que honorarios).
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.limitar_pagos_por_causa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT count(*) FROM public.pagos WHERE causa_id = NEW.causa_id) >= 50 THEN
    RAISE EXCEPTION 'Una causa puede tener hasta 50 pagos.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.limitar_gastos_por_causa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT count(*) FROM public.gastos WHERE causa_id = NEW.causa_id) >= 50 THEN
    RAISE EXCEPTION 'Una causa puede tener hasta 50 gastos.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.limitar_pagos_por_causa() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.limitar_gastos_por_causa() FROM PUBLIC;

CREATE TRIGGER pagos_limite
  BEFORE INSERT ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.limitar_pagos_por_causa();

CREATE TRIGGER gastos_limite
  BEFORE INSERT ON public.gastos
  FOR EACH ROW EXECUTE FUNCTION public.limitar_gastos_por_causa();
