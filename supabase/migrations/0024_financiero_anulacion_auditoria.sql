-- ============================================================
-- MANALEG CRM Â· MigraciÃ³n Financiera
-- AnulaciÃ³n + AuditorÃ­a + PolÃ­ticas corregidas
-- Octubre 2026
-- ============================================================

BEGIN;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 1. COLUMNAS: anulaciÃ³n + ajustes menores
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS pagado           boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anulado          boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anulado_por_id   uuid        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS anulado_at       timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_anulacion text;

ALTER TABLE public.honorarios
  ADD COLUMN IF NOT EXISTS anulado          boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anulado_por_id   uuid        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS anulado_at       timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_anulacion text;

ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS anulado          boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anulado_por_id   uuid        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS anulado_at       timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_anulacion text,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 2. TABLA DE AUDITORÃA INMUTABLE
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.auditoria_financiera (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla        text        NOT NULL,
  registro_id  uuid        NOT NULL,
  causa_id     uuid,
  accion       text        NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'ANULACION')),
  usuario_id   uuid        NOT NULL,
  datos_ant    jsonb,
  datos_nuevo  jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_registro ON public.auditoria_financiera(registro_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_causa    ON public.auditoria_financiera(causa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario  ON public.auditoria_financiera(usuario_id);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 3. ELIMINAR TODAS LAS POLÃTICAS EXISTENTES EN TABLAS FINANCIERAS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('honorarios', 'gastos', 'pagos', 'auditoria_financiera')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END;
$$;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 4. FUNCIÃ“N: controlar updates de colaboradores (SECURITY INVOKER)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.controlar_update_financiero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_causa_owner uuid;
BEGIN
  SELECT user_id INTO v_causa_owner
  FROM public.causas
  WHERE id = OLD.causa_id;

  IF v_causa_owner IS NULL THEN
    RAISE EXCEPTION 'Causa no encontrada para el registro financiero.'
      USING ERRCODE = 'P0001';
  END IF;

  IF auth.uid() = v_causa_owner THEN
    IF OLD.anulado = true AND NEW.anulado = false THEN
      RAISE EXCEPTION 'No se puede revertir una anulaciÃ³n.'
        USING ERRCODE = 'P0001';
    END IF;
    IF NEW.anulado = true AND OLD.anulado = false THEN
      IF NEW.motivo_anulacion IS NULL OR trim(NEW.motivo_anulacion) = '' THEN
        RAISE EXCEPTION 'Se requiere motivo_anulacion para anular el registro.'
          USING ERRCODE = 'P0001';
      END IF;
      NEW.anulado_por_id := auth.uid();
      NEW.anulado_at     := now();
    END IF;
    RETURN NEW;
  END IF;

  CASE TG_TABLE_NAME

    WHEN 'honorarios' THEN
      IF NEW.causa_id         IS DISTINCT FROM OLD.causa_id
      OR NEW.creado_por_id    IS DISTINCT FROM OLD.creado_por_id
      OR NEW.monto_acordado   IS DISTINCT FROM OLD.monto_acordado
      OR NEW.porcentaje       IS DISTINCT FROM OLD.porcentaje
      OR NEW.fecha_pacto      IS DISTINCT FROM OLD.fecha_pacto
      OR NEW.monto_cobrado    IS DISTINCT FROM OLD.monto_cobrado
      OR NEW.saldo_pendiente  IS DISTINCT FROM OLD.saldo_pendiente
      OR NEW.moneda           IS DISTINCT FROM OLD.moneda
      OR NEW.monto_adicional  IS DISTINCT FROM OLD.monto_adicional
      OR NEW.monto_consulta   IS DISTINCT FROM OLD.monto_consulta
      OR NEW.notas_honorarios IS DISTINCT FROM OLD.notas_honorarios
      OR NEW.anulado          IS DISTINCT FROM OLD.anulado
      OR NEW.anulado_por_id   IS DISTINCT FROM OLD.anulado_por_id
      OR NEW.anulado_at       IS DISTINCT FROM OLD.anulado_at
      OR NEW.motivo_anulacion IS DISTINCT FROM OLD.motivo_anulacion
      THEN
        RAISE EXCEPTION 'Los colaboradores solo pueden modificar consulta_cobrada en honorarios.'
          USING ERRCODE = 'P0001';
      END IF;

    WHEN 'gastos' THEN
      IF NEW.causa_id         IS DISTINCT FROM OLD.causa_id
      OR NEW.user_id          IS DISTINCT FROM OLD.user_id
      OR NEW.descripcion      IS DISTINCT FROM OLD.descripcion
      OR NEW.monto            IS DISTINCT FROM OLD.monto
      OR NEW.fecha            IS DISTINCT FROM OLD.fecha
      OR NEW.tipo             IS DISTINCT FROM OLD.tipo
      OR NEW.comprobante_url  IS DISTINCT FROM OLD.comprobante_url
      OR NEW.anulado          IS DISTINCT FROM OLD.anulado
      OR NEW.anulado_por_id   IS DISTINCT FROM OLD.anulado_por_id
      OR NEW.anulado_at       IS DISTINCT FROM OLD.anulado_at
      OR NEW.motivo_anulacion IS DISTINCT FROM OLD.motivo_anulacion
      THEN
        RAISE EXCEPTION 'Los colaboradores solo pueden marcar un gasto como pagado.'
          USING ERRCODE = 'P0001';
      END IF;

    WHEN 'pagos' THEN
      RAISE EXCEPTION 'Los colaboradores no pueden modificar registros de pagos.'
        USING ERRCODE = 'P0001';

    ELSE
      RAISE EXCEPTION 'Tabla no soportada: %', TG_TABLE_NAME;

  END CASE;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.controlar_update_financiero() FROM PUBLIC;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 5. FUNCIÃ“N: registro de auditorÃ­a (SECURITY DEFINER)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.registrar_auditoria_financiera()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_accion text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.auditoria_financiera
      (tabla, registro_id, causa_id, accion, usuario_id, datos_ant, datos_nuevo)
    VALUES
      (TG_TABLE_NAME, NEW.id, NEW.causa_id, 'INSERT', auth.uid(), NULL, to_jsonb(NEW));

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.auditoria_financiera
      (tabla, registro_id, causa_id, accion, usuario_id, datos_ant, datos_nuevo)
    VALUES
      (TG_TABLE_NAME, OLD.id, OLD.causa_id,
       CASE WHEN NEW.anulado = true AND OLD.anulado = false THEN 'ANULACION' ELSE 'UPDATE' END,
       auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_auditoria_financiera() FROM PUBLIC;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 6. FUNCIÃ“N: updated_at para pagos
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.set_updated_at_pagos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_updated_at_pagos() FROM PUBLIC;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 7. TRIGGERS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

DROP TRIGGER IF EXISTS trg_controlar_update_honorarios ON public.honorarios;
CREATE TRIGGER trg_controlar_update_honorarios
  BEFORE UPDATE ON public.honorarios
  FOR EACH ROW EXECUTE FUNCTION public.controlar_update_financiero();

DROP TRIGGER IF EXISTS trg_controlar_update_gastos ON public.gastos;
CREATE TRIGGER trg_controlar_update_gastos
  BEFORE UPDATE ON public.gastos
  FOR EACH ROW EXECUTE FUNCTION public.controlar_update_financiero();

DROP TRIGGER IF EXISTS trg_controlar_update_pagos ON public.pagos;
CREATE TRIGGER trg_controlar_update_pagos
  BEFORE UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.controlar_update_financiero();

DROP TRIGGER IF EXISTS trg_updated_at_pagos ON public.pagos;
CREATE TRIGGER trg_updated_at_pagos
  BEFORE UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_pagos();

DROP TRIGGER IF EXISTS trg_auditoria_honorarios ON public.honorarios;
CREATE TRIGGER trg_auditoria_honorarios
  AFTER INSERT OR UPDATE ON public.honorarios
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_financiera();

DROP TRIGGER IF EXISTS trg_auditoria_gastos ON public.gastos;
CREATE TRIGGER trg_auditoria_gastos
  AFTER INSERT OR UPDATE ON public.gastos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_financiera();

DROP TRIGGER IF EXISTS trg_auditoria_pagos ON public.pagos;
CREATE TRIGGER trg_auditoria_pagos
  AFTER INSERT OR UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_financiera();

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 8. RLS: HABILITAR + POLÃTICAS (usa public.*, no private.*)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE public.honorarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_financiera ENABLE ROW LEVEL SECURITY;

-- HONORARIOS
CREATE POLICY "honorarios_select" ON public.honorarios
  FOR SELECT TO authenticated
  USING (private.user_can_access_causa(causa_id));

CREATE POLICY "honorarios_insert" ON public.honorarios
  FOR INSERT TO authenticated
  WITH CHECK (private.user_can_access_causa(causa_id));

CREATE POLICY "honorarios_update" ON public.honorarios
  FOR UPDATE TO authenticated
  USING  (private.user_can_access_causa(causa_id))
  WITH CHECK (private.user_can_access_causa(causa_id));

-- GASTOS
CREATE POLICY "gastos_select" ON public.gastos
  FOR SELECT TO authenticated
  USING (private.user_can_access_causa(causa_id));

CREATE POLICY "gastos_insert" ON public.gastos
  FOR INSERT TO authenticated
  WITH CHECK (private.user_can_access_causa(causa_id));

CREATE POLICY "gastos_update" ON public.gastos
  FOR UPDATE TO authenticated
  USING  (private.user_can_access_causa(causa_id))
  WITH CHECK (private.user_can_access_causa(causa_id));

-- PAGOS
CREATE POLICY "pagos_select" ON public.pagos
  FOR SELECT TO authenticated
  USING (private.user_can_access_causa(causa_id));

CREATE POLICY "pagos_insert" ON public.pagos
  FOR INSERT TO authenticated
  WITH CHECK (private.user_can_access_causa(causa_id));

CREATE POLICY "pagos_update" ON public.pagos
  FOR UPDATE TO authenticated
  USING  (private.user_can_access_causa(causa_id))
  WITH CHECK (private.user_can_access_causa(causa_id));

-- AUDITORÃA: solo lectura para el actor o el dueÃ±o de la causa
CREATE POLICY "auditoria_select" ON public.auditoria_financiera
  FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR (causa_id IS NOT NULL AND private.user_owns_causa(causa_id))
  );

COMMIT;
