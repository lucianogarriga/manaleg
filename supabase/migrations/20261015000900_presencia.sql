-- ═══════════════════════════════════════════════════════════════
-- Corrige las políticas de presencia de causas (S-3).
-- realtime.topic() devuelve el nombre del canal tal como lo abre el cliente
-- ("causa-presence:<uuid>"), sin el prefijo "realtime:".
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "causa_presence_select" ON realtime.messages;
DROP POLICY IF EXISTS "causa_presence_insert" ON realtime.messages;

CREATE POLICY "causa_presence_select" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() LIKE 'causa-presence:%'
    AND private.user_can_access_causa(substring(realtime.topic() FROM '[0-9a-fA-F-]{36}$')::uuid)
  );

CREATE POLICY "causa_presence_insert" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    realtime.topic() LIKE 'causa-presence:%'
    AND private.user_can_access_causa(substring(realtime.topic() FROM '[0-9a-fA-F-]{36}$')::uuid)
  );
