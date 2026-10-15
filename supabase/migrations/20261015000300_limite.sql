-- ═══════════════════════════════════════════════════════════════
-- Tope de 50 honorarios por causa. Se controla en la base para que
-- aplique también a cualquier cliente, no solo a la interfaz.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.limitar_honorarios_por_causa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT count(*) FROM public.honorarios WHERE causa_id = NEW.causa_id) >= 50 THEN
    RAISE EXCEPTION 'Una causa puede tener hasta 50 honorarios.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.limitar_honorarios_por_causa() FROM PUBLIC;

CREATE TRIGGER honorarios_limite
  BEFORE INSERT ON public.honorarios
  FOR EACH ROW EXECUTE FUNCTION public.limitar_honorarios_por_causa();
