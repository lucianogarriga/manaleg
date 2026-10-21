-- Nuevas familias de paleta: claude y pastel (amplía el CHECK de profiles.paleta).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_paleta_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_paleta_check
    CHECK (paleta IN ('opcion1', 'opcion2', 'claude', 'pastel'));
