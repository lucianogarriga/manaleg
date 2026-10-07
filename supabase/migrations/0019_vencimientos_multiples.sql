-- ═══════════════════════════════════════════════════════════════
-- Migración 0019: Múltiples vencimientos por causa
--
-- 1. Recrea la tabla `vencimientos` con el esquema correcto
-- 2. Migra los datos existentes desde los campos planos de `causas`
-- 3. Agrega un trigger que mantiene causas.proximo_vencimiento
--    sincronizado automáticamente (compatibilidad con el frontend actual)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Recrear la tabla ──────────────────────────────────────────

DROP TABLE IF EXISTS public.vencimientos CASCADE;

CREATE TABLE public.vencimientos (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id       UUID        NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  creado_por_id  UUID        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo           TEXT        NOT NULL DEFAULT 'Vencimiento'
                             CHECK (tipo IN ('Vencimiento', 'Audiencia', 'Recordatorio')),
  fecha          DATE        NOT NULL,
  motivo         TEXT,
  anticipacion   TEXT        NOT NULL DEFAULT '1 día',
  completado     BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX ON public.vencimientos (causa_id);
CREATE INDEX ON public.vencimientos (fecha);
CREATE INDEX ON public.vencimientos (causa_id, completado, fecha);

-- ── 2. RLS ───────────────────────────────────────────────────────

ALTER TABLE public.vencimientos ENABLE ROW LEVEL SECURITY;

-- SELECT: titular o colaborador con acceso a la causa
CREATE POLICY "vencimientos_select" ON public.vencimientos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.causas c
      WHERE c.id = causa_id
        AND (
          c.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.causa_shares cs
            WHERE cs.causa_id = c.id AND cs.shared_with_user_id = auth.uid()
          )
        )
    )
  );

-- INSERT: solo el titular de la causa
CREATE POLICY "vencimientos_insert" ON public.vencimientos
  FOR INSERT WITH CHECK (
    creado_por_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.causas WHERE id = causa_id AND user_id = auth.uid()
    )
  );

-- UPDATE / DELETE: solo el titular
CREATE POLICY "vencimientos_update" ON public.vencimientos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.causas WHERE id = causa_id AND user_id = auth.uid())
  );

CREATE POLICY "vencimientos_delete" ON public.vencimientos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.causas WHERE id = causa_id AND user_id = auth.uid())
  );

-- ── 3. Migrar datos existentes desde causas ──────────────────────

INSERT INTO public.vencimientos
  (causa_id, creado_por_id, tipo, fecha, motivo, anticipacion)
SELECT
  id,
  user_id,
  COALESCE(tipo_vencimiento, 'Vencimiento'),
  proximo_vencimiento,
  motivo_vencimiento,
  COALESCE(anticipacion_alerta, '1 día')
FROM public.causas
WHERE proximo_vencimiento IS NOT NULL;

-- ── 4. Trigger: mantiene causas.proximo_vencimiento sincronizado ──
-- Permite que todo el código existente (AlertsBell, layoutCounts,
-- CalendarView, emails) siga funcionando sin cambios mientras
-- migramos el frontend gradualmente.

CREATE OR REPLACE FUNCTION public.sync_proximo_vencimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_causa_id UUID;
  v_next     RECORD;
BEGIN
  v_causa_id := COALESCE(NEW.causa_id, OLD.causa_id);

  -- El próximo vencimiento pendiente más cercano
  SELECT tipo, fecha, motivo
    INTO v_next
    FROM public.vencimientos
   WHERE causa_id  = v_causa_id
     AND completado = false
   ORDER BY fecha ASC
   LIMIT 1;

  UPDATE public.causas
  SET
    proximo_vencimiento = v_next.fecha,
    tipo_vencimiento    = v_next.tipo,
    motivo_vencimiento  = v_next.motivo
  WHERE id = v_causa_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER vencimientos_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.vencimientos
  FOR EACH ROW EXECUTE FUNCTION public.sync_proximo_vencimiento();
