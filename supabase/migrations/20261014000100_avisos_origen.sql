-- ═══════════════════════════════════════════════════════════════
-- Cada aviso se registra por su origen (vencimiento o evento), no por
-- causa + fecha. Con la clave anterior, dos vencimientos de la misma
-- causa en la misma fecha se pisaban y el aviso se repetía a diario.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.avisos_enviados
  ADD COLUMN IF NOT EXISTS origen_tipo TEXT CHECK (origen_tipo IN ('vencimiento', 'evento')),
  ADD COLUMN IF NOT EXISTS origen_id   UUID;

ALTER TABLE public.avisos_enviados
  DROP CONSTRAINT IF EXISTS avisos_enviados_causa_id_user_id_fecha_vencimiento_canal_key;

CREATE UNIQUE INDEX IF NOT EXISTS avisos_enviados_origen_uniq
  ON public.avisos_enviados (user_id, origen_tipo, origen_id, canal)
  WHERE origen_id IS NOT NULL;
