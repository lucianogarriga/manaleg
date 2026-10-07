-- ═══════════════════════════════════════════════════════════════
-- Migración 0020: Campos de agenda en vencimientos + trigger fix
--
-- 1. Agrega columnas opcionales para Audiencia y Vencimiento
-- 2. Actualiza el trigger: los Recordatorios NO alimentan
--    causas.proximo_vencimiento (no afectan semáforo ni email)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Nuevas columnas ───────────────────────────────────────────

ALTER TABLE public.vencimientos
  ADD COLUMN IF NOT EXISTS hora          TIME,          -- Audiencia: hora de la audiencia
  ADD COLUMN IF NOT EXISTS lugar         VARCHAR(150),  -- Audiencia: lugar / juzgado
  ADD COLUMN IF NOT EXISTS notas         TEXT,          -- Audiencia: notas libres
  ADD COLUMN IF NOT EXISTS acto_procesal VARCHAR(200);  -- Vencimiento: descripción del acto

-- ── 2. Trigger actualizado ───────────────────────────────────────
-- Los Recordatorios quedan excluidos del cálculo de proximo_vencimiento.
-- Solo Audiencia y Vencimiento afectan el semáforo y generan emails.

CREATE OR REPLACE FUNCTION public.sync_proximo_vencimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_causa_id UUID;
  v_next     RECORD;
BEGIN
  v_causa_id := COALESCE(NEW.causa_id, OLD.causa_id);

  -- Próximo vencimiento o audiencia pendiente (excluye Recordatorios)
  SELECT tipo, fecha, motivo
    INTO v_next
    FROM public.vencimientos
   WHERE causa_id  = v_causa_id
     AND completado = false
     AND tipo      <> 'Recordatorio'
   ORDER BY fecha ASC
   LIMIT 1;

  UPDATE public.causas
  SET
    proximo_vencimiento = v_next.fecha,
    tipo_vencimiento    = v_next.tipo,
    motivo_vencimiento  = v_next.motivo
  WHERE id = v_causa_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;
