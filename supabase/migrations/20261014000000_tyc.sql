-- ═══════════════════════════════════════════════════════════════
-- Aceptación de T&C registrada por la base, no por el cliente.
--
-- consentimientos: registro append-only de cada aceptación (prueba).
-- aceptar_tyc: única vía del usuario para aceptar; toma el usuario de
-- la sesión. La versión "1.0" debe coincidir con CURRENT_TYC_VERSION
-- en utils/constants.ts; al publicar una versión nueva, se cambia aquí
-- con una migración nueva.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.consentimientos (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version      text NOT NULL,
  accepted_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consentimientos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.consentimientos FROM anon, authenticated;

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

  IF p_version IS DISTINCT FROM '1.0' THEN
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

REVOKE UPDATE (tyc_accepted_at, tyc_version) ON public.profiles FROM authenticated;
