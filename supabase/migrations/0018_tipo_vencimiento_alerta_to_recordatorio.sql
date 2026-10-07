-- 1. Soltar el constraint viejo primero (permite cualquier valor temporalmente)
ALTER TABLE public.causas
  DROP CONSTRAINT IF EXISTS causas_tipo_vencimiento_check;

-- 2. Migrar registros legacy 'Alerta' → 'Recordatorio'
UPDATE public.causas
SET tipo_vencimiento = 'Recordatorio'
WHERE tipo_vencimiento = 'Alerta';

-- 3. Recrear el constraint con los valores canónicos
ALTER TABLE public.causas
  ADD CONSTRAINT causas_tipo_vencimiento_check
  CHECK (tipo_vencimiento IN ('Vencimiento', 'Audiencia', 'Recordatorio'));
