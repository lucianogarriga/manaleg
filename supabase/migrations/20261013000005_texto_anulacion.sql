-- ═══════════════════════════════════════════════════════════════
-- Corrige la codificación de textos en controlar_update_financiero.
--
-- La migración 0024 quedó guardada con caracteres mal codificados
-- ("anulaciÃ³n"), y el mensaje de error llega así al usuario.
-- Solo cambian los textos; la lógica es la misma.
-- ═══════════════════════════════════════════════════════════════

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
      RAISE EXCEPTION 'No se puede revertir una anulación.'
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
