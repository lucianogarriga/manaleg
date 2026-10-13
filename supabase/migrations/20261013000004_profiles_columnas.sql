-- ═══════════════════════════════════════════════════════════════
-- Restringe qué columnas de profiles puede modificar el usuario.
--
-- Antes, cualquier usuario autenticado podía cambiar su propio plan,
-- causas_max y estado_pago (hallazgo S-1 de AUDITORIA.md). Ahora solo
-- puede editar las columnas que usa la app. plan, estado_pago y
-- causas_max quedan para service_role (futuro webhook de pagos).
-- ═══════════════════════════════════════════════════════════════

REVOKE UPDATE ON public.profiles FROM anon, authenticated;

GRANT UPDATE (
  nombre_completo,
  empresa,
  notificaciones_email,
  tyc_accepted_at,
  tyc_version
) ON public.profiles TO authenticated;
