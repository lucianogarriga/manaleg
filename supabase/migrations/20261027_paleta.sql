-- Paleta de colores por usuario (opcion1 = paleta actual, opcion2 = paleta anterior).
-- El usuario solo puede cambiar esta columna, igual que preferencia_graficos.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paleta TEXT NOT NULL DEFAULT 'opcion1'
    CHECK (paleta IN ('opcion1', 'opcion2'));

GRANT UPDATE (paleta) ON public.profiles TO authenticated;
