-- Se quita la paleta Pastel: los perfiles que la tenían pasan a Navy (opcion1).
UPDATE public.profiles SET paleta = 'opcion1' WHERE paleta = 'pastel';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_paleta_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_paleta_check
    CHECK (paleta IN ('opcion1', 'claude'));
