-- Invitaciones a causas: rechazo registrado (sin borrar) para mostrar el modal de pendientes.
ALTER TABLE public.invitaciones ADD COLUMN IF NOT EXISTS rechazada_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS invitaciones_email_idx ON public.invitaciones (email);
