-- Black y Navy se unifican en la opción 1 (Navy). Los perfiles con opcion2 pasan a opcion1.
UPDATE public.profiles SET paleta = 'opcion1' WHERE paleta = 'opcion2';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_paleta_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_paleta_check
    CHECK (paleta IN ('opcion1', 'claude', 'pastel'));
