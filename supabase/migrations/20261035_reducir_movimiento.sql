-- Preferencia de usuario: reducir movimiento (animaciones y conteos).
-- Por defecto desactivada; cuando está activa la interfaz quita animaciones aunque el sistema no lo pida.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reducir_movimiento BOOLEAN NOT NULL DEFAULT false;
