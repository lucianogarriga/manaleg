-- ═══════════════════════════════════════════════════════════════
-- Cambios de campos en causas
--
-- 1) Fuero (desplegable) y Tipo de juicio (texto libre)
--      fuero      (texto)      → tipo_juicio
--      tipo_causa (desplegable) → fuero
--
-- 2) Próxima alerta / vencimiento
--      tipo_vencimiento pasa a ser un desplegable: 'Alerta' | 'Vencimiento'
--      motivo_vencimiento (nuevo) = texto libre con el motivo
--    Lo que ya estaba cargado en tipo_vencimiento (texto libre) se mueve
--    a motivo_vencimiento, y las causas con fecha quedan como 'Vencimiento'.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.causas RENAME COLUMN fuero TO tipo_juicio;
ALTER TABLE public.causas RENAME COLUMN tipo_causa TO fuero;

ALTER TABLE public.causas ADD COLUMN motivo_vencimiento TEXT;

UPDATE public.causas SET motivo_vencimiento = tipo_vencimiento;

UPDATE public.causas
SET tipo_vencimiento = CASE WHEN proximo_vencimiento IS NOT NULL THEN 'Vencimiento' END;

ALTER TABLE public.causas
  ADD CONSTRAINT causas_tipo_vencimiento_check
  CHECK (tipo_vencimiento IN ('Alerta', 'Vencimiento'));
