-- ═══════════════════════════════════════════════════════════════
-- Consentimiento T&C + preferencia de notificaciones por email
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tyc_accepted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tyc_version        TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS notificaciones_email BOOLEAN NOT NULL DEFAULT true;
