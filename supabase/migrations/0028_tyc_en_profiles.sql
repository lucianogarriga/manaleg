-- Poblar tyc_accepted_at y tyc_version en profiles al registrarse.
-- Los valores los genera la DB (timestamp = NOW(), versión = constante),
-- no el cliente ni el server action.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo, tyc_accepted_at, tyc_version)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'nombre_completo',
    NOW(),
    '1.0'
  );
  RETURN NEW;
END;
$$;
