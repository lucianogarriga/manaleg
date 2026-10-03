-- ═══════════════════════════════════════════════════════════════
-- Índices de rendimiento + política UPDATE en causa_shares
-- CONCURRENTLY removido: las tablas son pequeñas y el lock dura ms
-- ═══════════════════════════════════════════════════════════════

-- ─── ÍNDICES ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_causas_user_estado
  ON public.causas (user_id, estado);

CREATE INDEX IF NOT EXISTS idx_causas_proximo_vencimiento
  ON public.causas (user_id, proximo_vencimiento)
  WHERE proximo_vencimiento IS NOT NULL AND estado <> 'Cerrada';

CREATE INDEX IF NOT EXISTS idx_causas_created_at
  ON public.causas (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_eventos_fecha
  ON public.eventos (fecha, tipo);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago
  ON public.pagos (causa_id, fecha_pago);

CREATE INDEX IF NOT EXISTS idx_clientes_created_at
  ON public.clientes (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_causa_shares_shared_with
  ON public.causa_shares (shared_with_user_id);

-- ─── POLÍTICA UPDATE EN causa_shares ───────────────────────────
-- Nadie puede hacer UPDATE en causa_shares: el acceso se gestiona
-- creando o eliminando filas (INSERT/DELETE), nunca modificándolas.

CREATE POLICY "causa_shares_no_update" ON public.causa_shares
  FOR UPDATE TO authenticated
  USING (false);
