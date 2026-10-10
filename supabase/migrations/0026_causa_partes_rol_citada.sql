-- Agrega 'citada_en_garantia' como rol válido en causa_partes
ALTER TABLE public.causa_partes
  DROP CONSTRAINT causa_partes_rol_check;

ALTER TABLE public.causa_partes
  ADD CONSTRAINT causa_partes_rol_check
  CHECK (rol IN (
    'actora', 'demandada', 'solicitante', 'requirente',
    'solicitado', 'requerido', 'tercero', 'tercerista',
    'adquirente', 'citada_en_garantia', 'otro'
  ));
