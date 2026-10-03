-- ═══════════════════════════════════════════════════════════════
-- Columnas de consentimiento de T&C en profiles
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tyc_accepted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tyc_version      TEXT DEFAULT '1.0';
