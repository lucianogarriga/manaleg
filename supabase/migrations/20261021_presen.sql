-- ═══════════════════════════════════════════════════════════════
-- 1) Preferencia de presencia por causa: cada usuario decide si quienes
--    comparten la causa ven que la tiene abierta. Solo se guarda la preferencia,
--    nunca el historial de presencia (eso es efímero, en Realtime).
-- 2) T&C versión 1.1: aceptar_tyc acepta la nueva versión.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.causa_presencia (
  causa_id   uuid NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visible    boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (causa_id, user_id)
);

ALTER TABLE public.causa_presencia ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo lee y cambia su propia preferencia, y solo en causas a las que tiene acceso.
CREATE POLICY "causa_presencia_select_propia" ON public.causa_presencia
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) AND private.user_can_access_causa(causa_id));

CREATE POLICY "causa_presencia_insert_propia" ON public.causa_presencia
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND private.user_can_access_causa(causa_id));

CREATE POLICY "causa_presencia_update_propia" ON public.causa_presencia
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) AND private.user_can_access_causa(causa_id))
  WITH CHECK (user_id = (select auth.uid()) AND private.user_can_access_causa(causa_id));

REVOKE ALL ON public.causa_presencia FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.causa_presencia TO authenticated;

-- T&C 1.1. Debe coincidir con CURRENT_TYC_VERSION en utils/constants.ts.
CREATE OR REPLACE FUNCTION public.aceptar_tyc(p_version text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  IF p_version IS DISTINCT FROM '1.1' THEN
    RAISE EXCEPTION 'Versión de T&C no vigente.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.consentimientos (user_id, version) VALUES (v_uid, p_version);

  UPDATE public.profiles
  SET tyc_accepted_at = now(), tyc_version = p_version
  WHERE id = v_uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aceptar_tyc(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aceptar_tyc(text) TO authenticated;
