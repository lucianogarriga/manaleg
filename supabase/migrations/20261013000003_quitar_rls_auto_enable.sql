-- ═══════════════════════════════════════════════════════════════
-- Quitar el event trigger ensure_rls y su función rls_auto_enable.
--
-- Existían solo en staging (no están en el repo ni en producción).
-- Producción no tiene activación automática de RLS, así que staging
-- se alinea. Si más adelante se decide agregarla a producción, se
-- hará en una migración aparte.
-- ═══════════════════════════════════════════════════════════════

DROP EVENT TRIGGER IF EXISTS ensure_rls;

DROP FUNCTION IF EXISTS public.rls_auto_enable();
