-- ═══════════════════════════════════════════════════════════════
-- Alinear políticas RLS del repo con producción.
--
-- Producción tenía estas políticas cargadas a mano (sin migración):
--   - movimientos: usan private.user_can_access_causa (la 0001 usa public.*).
--   - avisos_enviados: política restrictiva "no direct access".
--
-- En producción esta migración NO se ejecuta: las definiciones ya existen.
-- Se registra en el historial (ver instrucciones de la auditoría). En staging
-- sí se aplica, para que staging quede igual a producción.
-- ═══════════════════════════════════════════════════════════════

-- ─── MOVIMIENTOS ───

DROP POLICY IF EXISTS "movimientos_select" ON public.movimientos;
CREATE POLICY "movimientos_select" ON public.movimientos
  FOR SELECT TO authenticated
  USING (private.user_can_access_causa(causa_id));

DROP POLICY IF EXISTS "movimientos_insert" ON public.movimientos;
CREATE POLICY "movimientos_insert" ON public.movimientos
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = autor_id) AND private.user_can_access_causa(causa_id));

DROP POLICY IF EXISTS "movimientos_update" ON public.movimientos;
CREATE POLICY "movimientos_update" ON public.movimientos
  FOR UPDATE TO authenticated
  USING (auth.uid() = autor_id)
  WITH CHECK ((auth.uid() = autor_id) AND private.user_can_access_causa(causa_id));

-- ─── AVISOS_ENVIADOS ───
-- RLS ya está activo sin políticas permisivas: nadie logueado puede leer ni escribir.
-- Esta política restrictiva lo deja explícito. Solo el service role (cron) accede.

DROP POLICY IF EXISTS "no direct access" ON public.avisos_enviados;
CREATE POLICY "no direct access" ON public.avisos_enviados
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (false);
