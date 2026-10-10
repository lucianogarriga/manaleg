-- ═══════════════════════════════════════════════════════════════
-- SUPERSEDED: contenido absorbido por 0010_tyc_y_notificaciones_email.sql
-- Mantenido solo para compatibilidad con entornos que lo tienen en el historial.
-- Todas las columnas usan IF NOT EXISTS, por lo que es seguro de re-aplicar.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tyc_accepted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tyc_version      TEXT DEFAULT '1.0';
