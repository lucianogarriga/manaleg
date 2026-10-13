-- ═══════════════════════════════════════════════════════════════
-- Extensiones requeridas por las migraciones posteriores.
--
-- moddatetime: la usa el trigger de updated_at de gastos (0013).
-- En producción ya estaba instalada en el schema extensions; esta
-- migración la declara para que un proyecto nuevo (staging) la tenga.
-- Sobre producción no tiene efecto (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;
