-- ═══════════════════════════════════════════════════════════════
-- Los vencimientos cargados desde el formulario de causa viven en
-- causas.proximo_vencimiento (sin fila en vencimientos). Se avisan con
-- origen 'causa'. La clave de envío incluye la fecha: si un vencimiento
-- se reprograma, vuelve a avisarse.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.avisos_enviados
  DROP CONSTRAINT IF EXISTS avisos_enviados_origen_tipo_check;

ALTER TABLE public.avisos_enviados
  ADD CONSTRAINT avisos_enviados_origen_tipo_check
  CHECK (origen_tipo IN ('vencimiento', 'evento', 'causa'));

DROP INDEX IF EXISTS public.avisos_enviados_origen_uniq;

CREATE UNIQUE INDEX avisos_enviados_origen_uniq
  ON public.avisos_enviados (user_id, origen_tipo, origen_id, canal, fecha_vencimiento)
  WHERE origen_id IS NOT NULL;
