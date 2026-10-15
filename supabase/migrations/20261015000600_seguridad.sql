-- ═══════════════════════════════════════════════════════════════
-- Seguridad P0.
-- S-2: los links y comprobantes solo pueden ser https (no javascript:).
--      NOT VALID: exige el formato en toda escritura nueva. Para validar
--      también las filas existentes: ALTER TABLE … VALIDATE CONSTRAINT.
-- S-3: el canal de presencia de una causa solo lo pueden usar quienes
--      tienen acceso a esa causa.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.causas
  ADD CONSTRAINT causas_link_drive_https
  CHECK (link_drive IS NULL OR link_drive ~* '^https://') NOT VALID;

ALTER TABLE public.pagos
  ADD CONSTRAINT pagos_comprobante_https
  CHECK (comprobante_drive IS NULL OR comprobante_drive ~* '^https://') NOT VALID;

ALTER TABLE public.gastos
  ADD CONSTRAINT gastos_comprobante_https
  CHECK (comprobante_url IS NULL OR comprobante_url ~* '^https://') NOT VALID;

DROP POLICY IF EXISTS "causa_presence_select" ON realtime.messages;
CREATE POLICY "causa_presence_select" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() LIKE 'realtime:causa-presence:%'
    AND private.user_can_access_causa(substring(realtime.topic() FROM '[0-9a-fA-F-]{36}$')::uuid)
  );

DROP POLICY IF EXISTS "causa_presence_insert" ON realtime.messages;
CREATE POLICY "causa_presence_insert" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    realtime.topic() LIKE 'realtime:causa-presence:%'
    AND private.user_can_access_causa(substring(realtime.topic() FROM '[0-9a-fA-F-]{36}$')::uuid)
  );
