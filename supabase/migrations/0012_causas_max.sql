-- ═══════════════════════════════════════════════════════════════
-- Límite de causas por usuario según plan
-- ═══════════════════════════════════════════════════════════════
--
-- causas_max: tope de causas que puede tener un usuario.
-- Default 100 para fase beta. Se sube manualmente en el Dashboard
-- cuando el usuario pasa a un plan de pago.
--
-- Valores de referencia:
--   beta / free → 100
--   pro          → 400
--   sin límite   → 9999

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS causas_max INTEGER NOT NULL DEFAULT 100;

COMMENT ON COLUMN public.profiles.causas_max IS
  'Cantidad máxima de causas propias que puede crear el usuario. Beta default: 100.';
