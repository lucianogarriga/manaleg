-- ═══════════════════════════════════════════════════════════════
-- Registro de avisos enviados por email (alertas y vencimientos)
--
-- Evita mandar dos veces el mismo aviso si el proceso diario se ejecuta
-- más de una vez. Solo lo usa el servidor con la clave secreta
-- (service role): RLS queda activado sin policies, así que los usuarios
-- logueados no pueden leer ni escribir esta tabla.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.avisos_enviados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fecha_vencimiento DATE NOT NULL,        -- fecha del aviso al momento del envío
  canal TEXT NOT NULL DEFAULT 'email',    -- 'email' | 'whatsapp' (futuro)
  enviado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (causa_id, user_id, fecha_vencimiento, canal)
);

ALTER TABLE public.avisos_enviados ENABLE ROW LEVEL SECURITY;

CREATE INDEX ON public.avisos_enviados (user_id);
