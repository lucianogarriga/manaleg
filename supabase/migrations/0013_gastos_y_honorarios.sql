-- ═══════════════════════════════════════════════════════════════
-- Tabla GASTOS + mejoras en HONORARIOS
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Tabla gastos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gastos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id        UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  descripcion     TEXT NOT NULL,
  monto           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo            TEXT,
  comprobante_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER gastos_updated_at
  BEFORE UPDATE ON public.gastos
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- Puede ver gastos quien es owner de la causa o tiene share
CREATE POLICY "gastos_select" ON public.gastos
  FOR SELECT TO authenticated USING (
    causa_id IN (
      SELECT id FROM public.causas WHERE user_id = auth.uid()
      UNION
      SELECT cs.causa_id FROM public.causa_shares cs WHERE cs.shared_with_user_id = auth.uid()
    )
  );

-- Puede insertar quien tiene acceso a la causa
CREATE POLICY "gastos_insert" ON public.gastos
  FOR INSERT TO authenticated WITH CHECK (
    causa_id IN (
      SELECT id FROM public.causas WHERE user_id = auth.uid()
      UNION
      SELECT cs.causa_id FROM public.causa_shares cs WHERE cs.shared_with_user_id = auth.uid()
    )
  );

-- Solo quien lo creó puede modificarlo
CREATE POLICY "gastos_update" ON public.gastos
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Solo quien lo creó puede borrarlo
CREATE POLICY "gastos_delete" ON public.gastos
  FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─── 2. Mejoras en honorarios ──────────────────────────────────
ALTER TABLE public.honorarios
  ADD COLUMN IF NOT EXISTS moneda            TEXT NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS monto_adicional   NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS consulta_cobrada  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monto_consulta    NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS notas_honorarios  TEXT;
