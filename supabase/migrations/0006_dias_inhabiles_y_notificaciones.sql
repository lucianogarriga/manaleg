-- ═══════════════════════════════════════════════════════════════
-- 1) DÍAS INHÁBILES (feriados, ferias judiciales)
--    Alimentan el calendario, la calculadora de plazos y el envío de mails
--    (el aviso del viernes cubre el próximo día HÁBIL).
--      user_id NULL  → feriado nacional cargado por el sistema (lo ven todos)
--      user_id = yo  → día inhábil propio (feria judicial, asueto del tribunal…)
--
-- 2) NOTIFICACIONES ENTRE COLEGAS
--    Cuando alguien modifica una causa compartida, los demás con acceso
--    reciben una notificación (la campana). Las generan triggers.
-- ═══════════════════════════════════════════════════════════════


-- ─── DÍAS INHÁBILES ───

CREATE TABLE public.dias_inhabiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Día inhábil',  -- Feriado nacional | Feria judicial | Día inhábil
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, fecha)
);

CREATE INDEX ON public.dias_inhabiles (fecha);

ALTER TABLE public.dias_inhabiles ENABLE ROW LEVEL SECURITY;

-- Ver: los globales (user_id NULL) y los propios
CREATE POLICY "dias_inhabiles_select" ON public.dias_inhabiles
  FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());

-- Crear / borrar: solo los propios (los globales solo se cargan por migración)
CREATE POLICY "dias_inhabiles_insert" ON public.dias_inhabiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "dias_inhabiles_update" ON public.dias_inhabiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "dias_inhabiles_delete" ON public.dias_inhabiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dias_inhabiles TO authenticated;
REVOKE ALL ON public.dias_inhabiles FROM anon;

-- Feriados nacionales de Argentina 2026 y 2027.
-- IMPORTANTE: verificar contra la normativa vigente y el calendario del
-- tribunal. No incluye días no laborables "puente" ni ferias judiciales.
INSERT INTO public.dias_inhabiles (user_id, fecha, descripcion, tipo) VALUES
  (NULL, '2026-01-01', 'Año Nuevo', 'Feriado nacional'),
  (NULL, '2026-02-16', 'Carnaval', 'Feriado nacional'),
  (NULL, '2026-02-17', 'Carnaval', 'Feriado nacional'),
  (NULL, '2026-03-24', 'Día Nacional de la Memoria por la Verdad y la Justicia', 'Feriado nacional'),
  (NULL, '2026-04-02', 'Día del Veterano y de los Caídos en la Guerra de Malvinas', 'Feriado nacional'),
  (NULL, '2026-04-03', 'Viernes Santo', 'Feriado nacional'),
  (NULL, '2026-05-01', 'Día del Trabajador', 'Feriado nacional'),
  (NULL, '2026-05-25', 'Día de la Revolución de Mayo', 'Feriado nacional'),
  (NULL, '2026-06-15', 'Paso a la Inmortalidad del Gral. Güemes (trasladado del 17/6)', 'Feriado nacional'),
  (NULL, '2026-06-20', 'Paso a la Inmortalidad del Gral. Belgrano', 'Feriado nacional'),
  (NULL, '2026-07-09', 'Día de la Independencia', 'Feriado nacional'),
  (NULL, '2026-08-17', 'Paso a la Inmortalidad del Gral. San Martín', 'Feriado nacional'),
  (NULL, '2026-10-12', 'Día del Respeto a la Diversidad Cultural', 'Feriado nacional'),
  (NULL, '2026-11-23', 'Día de la Soberanía Nacional (trasladado del 20/11)', 'Feriado nacional'),
  (NULL, '2026-12-08', 'Inmaculada Concepción de María', 'Feriado nacional'),
  (NULL, '2026-12-25', 'Navidad', 'Feriado nacional'),

  (NULL, '2027-01-01', 'Año Nuevo', 'Feriado nacional'),
  (NULL, '2027-02-08', 'Carnaval', 'Feriado nacional'),
  (NULL, '2027-02-09', 'Carnaval', 'Feriado nacional'),
  (NULL, '2027-03-24', 'Día Nacional de la Memoria por la Verdad y la Justicia', 'Feriado nacional'),
  (NULL, '2027-03-26', 'Viernes Santo', 'Feriado nacional'),
  (NULL, '2027-04-02', 'Día del Veterano y de los Caídos en la Guerra de Malvinas', 'Feriado nacional'),
  (NULL, '2027-05-01', 'Día del Trabajador', 'Feriado nacional'),
  (NULL, '2027-05-25', 'Día de la Revolución de Mayo', 'Feriado nacional'),
  (NULL, '2027-06-20', 'Paso a la Inmortalidad del Gral. Belgrano', 'Feriado nacional'),
  (NULL, '2027-06-21', 'Paso a la Inmortalidad del Gral. Güemes (trasladado del 17/6)', 'Feriado nacional'),
  (NULL, '2027-07-09', 'Día de la Independencia', 'Feriado nacional'),
  (NULL, '2027-08-16', 'Paso a la Inmortalidad del Gral. San Martín (trasladado del 17/8)', 'Feriado nacional'),
  (NULL, '2027-10-11', 'Día del Respeto a la Diversidad Cultural (trasladado del 12/10)', 'Feriado nacional'),
  (NULL, '2027-11-20', 'Día de la Soberanía Nacional', 'Feriado nacional'),
  (NULL, '2027-12-08', 'Inmaculada Concepción de María', 'Feriado nacional'),
  (NULL, '2027-12-25', 'Navidad', 'Feriado nacional');


-- ─── NOTIFICACIONES ENTRE COLEGAS ───

CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,       -- destinatario
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,              -- quién hizo el cambio
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,  -- causa_editada | movimiento | honorarios | pago | compartida
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON public.notificaciones (user_id, leida, created_at DESC);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve, marca como leídas y borra solo las suyas.
-- No hay policy de INSERT: solo las crean los triggers (SECURITY DEFINER).
CREATE POLICY "notificaciones_select" ON public.notificaciones
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notificaciones_update" ON public.notificaciones
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notificaciones_delete" ON public.notificaciones
  FOR DELETE TO authenticated USING (user_id = auth.uid());

GRANT SELECT, UPDATE, DELETE ON public.notificaciones TO authenticated;
REVOKE ALL ON public.notificaciones FROM anon;

-- Crea una notificación para el titular y los colaboradores de la causa,
-- menos para quien hizo el cambio. Sin sesión (tareas del sistema) no notifica.
CREATE OR REPLACE FUNCTION public.notify_causa_colegas(p_causa UUID, p_tipo TEXT, p_mensaje TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_nombre TEXT;
BEGIN
  IF v_actor IS NULL THEN RETURN; END IF;

  SELECT COALESCE(nombre_completo, email) INTO v_nombre FROM public.profiles WHERE id = v_actor;

  INSERT INTO public.notificaciones (user_id, actor_id, causa_id, tipo, mensaje)
  SELECT u.uid, v_actor, p_causa, p_tipo, v_nombre || ' ' || p_mensaje
  FROM (
    SELECT c.user_id AS uid FROM public.causas c WHERE c.id = p_causa
    UNION
    SELECT s.shared_with_user_id FROM public.causa_shares s WHERE s.causa_id = p_causa
  ) u
  WHERE u.uid <> v_actor;
END;
$$;

-- Solo la usan los triggers: que nadie pueda llamarla por la API y mandar
-- mensajes arbitrarios a sus colegas.
REVOKE EXECUTE ON FUNCTION public.notify_causa_colegas(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Edición de la causa. Los cambios automáticos (último movimiento / editor /
-- updated_at) no cuentan: solo cuando cambia algún dato real.
CREATE OR REPLACE FUNCTION public.notify_on_causa_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['updated_at', 'ultimo_editor_id', 'fecha_ultimo_movimiento'])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['updated_at', 'ultimo_editor_id', 'fecha_ultimo_movimiento']) THEN
    PERFORM public.notify_causa_colegas(NEW.id, 'causa_editada', 'editó la causa');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_causa_update
  AFTER UPDATE ON public.causas
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_causa_update();

-- Movimientos
CREATE OR REPLACE FUNCTION public.notify_on_movimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.notify_causa_colegas(
    NEW.causa_id, 'movimiento', 'cargó un movimiento: ' || left(NEW.descripcion, 80)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_movimiento
  AFTER INSERT ON public.movimientos
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_movimiento();

-- Honorarios (el monto cobrado cambia solo por los pagos: no se notifica acá)
CREATE OR REPLACE FUNCTION public.notify_on_honorario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_causa_colegas(NEW.causa_id, 'honorarios', 'definió los honorarios');
  ELSIF (NEW.monto_acordado, NEW.porcentaje, NEW.fecha_pacto)
        IS DISTINCT FROM (OLD.monto_acordado, OLD.porcentaje, OLD.fecha_pacto) THEN
    PERFORM public.notify_causa_colegas(NEW.causa_id, 'honorarios', 'actualizó los honorarios');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_honorario
  AFTER INSERT OR UPDATE ON public.honorarios
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_honorario();

-- Pagos
CREATE OR REPLACE FUNCTION public.notify_on_pago()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.notify_causa_colegas(
    NEW.causa_id, 'pago',
    'registró un pago de $' || replace(to_char(NEW.monto, 'FM999,999,999,990'), ',', '.')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_pago
  AFTER INSERT ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_pago();

-- Causa compartida contigo: avisa al invitado
CREATE OR REPLACE FUNCTION public.notify_on_share()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nombre TEXT;
BEGIN
  SELECT COALESCE(nombre_completo, email) INTO v_nombre FROM public.profiles WHERE id = NEW.invited_by_user_id;

  INSERT INTO public.notificaciones (user_id, actor_id, causa_id, tipo, mensaje)
  VALUES (NEW.shared_with_user_id, NEW.invited_by_user_id, NEW.causa_id, 'compartida',
          v_nombre || ' compartió una causa con vos');
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_share
  AFTER INSERT ON public.causa_shares
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_share();
