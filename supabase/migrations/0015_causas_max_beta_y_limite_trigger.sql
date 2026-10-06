-- ═══════════════════════════════════════════════════════════════
-- Beta: limitar causas_max a 60 y proteger el límite con trigger
-- ═══════════════════════════════════════════════════════════════

-- 1. Bajar el default a 60 para nuevos usuarios en fase beta
ALTER TABLE public.profiles
  ALTER COLUMN causas_max SET DEFAULT 60;

-- 2. Actualizar usuarios existentes que tenían el default anterior (100)
--    Solo toca a quienes nunca se les modificó manualmente el límite.
UPDATE public.profiles
  SET causas_max = 60
  WHERE causas_max = 100;

-- 3. Trigger que impide superar causas_max (evita race condition check-then-insert)
CREATE OR REPLACE FUNCTION public.check_causas_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INTEGER;
  v_max   INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM public.causas
    WHERE user_id = NEW.user_id;

  SELECT causas_max INTO v_max
    FROM public.profiles
    WHERE id = NEW.user_id;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Límite de causas alcanzado (máx. %)', v_max;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_causas_limit ON public.causas;
CREATE TRIGGER enforce_causas_limit
  BEFORE INSERT ON public.causas
  FOR EACH ROW EXECUTE FUNCTION public.check_causas_limit();
