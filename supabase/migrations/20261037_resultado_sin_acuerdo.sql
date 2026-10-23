-- Nuevo resultado de cierre: "Sin acuerdo" (defensa del consumidor, mediación o reclamo administrativo
-- que terminan sin acuerdo). Se reemplaza la restricción de resultado para incluir el nuevo valor.
ALTER TABLE public.causas DROP CONSTRAINT IF EXISTS causas_resultado_check;
ALTER TABLE public.causas
  ADD CONSTRAINT causas_resultado_check
  CHECK (resultado IN ('Ganada', 'Transada', 'Perdida', 'Sin acuerdo'));
