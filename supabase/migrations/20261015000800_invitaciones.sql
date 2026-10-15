-- ═══════════════════════════════════════════════════════════════
-- Invitaciones a causas (S-5). Se acepta con un enlace de un solo uso.
-- Solo el servidor escribe (service role); el titular puede ver las suyas.
-- Se elimina buscar_perfil_por_email, que revelaba si un email tenía cuenta.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.invitaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id        UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  invitado_por_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email           TEXT NOT NULL CHECK (email = lower(email)),
  token_hash      TEXT NOT NULL UNIQUE,
  expira_at       TIMESTAMPTZ NOT NULL,
  aceptada_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON public.invitaciones (causa_id);

ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitaciones_select" ON public.invitaciones
  FOR SELECT TO authenticated
  USING (private.user_owns_causa(causa_id));

DROP FUNCTION IF EXISTS public.buscar_perfil_por_email(text);
