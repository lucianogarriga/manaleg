-- Agrega 'denunciante' y 'denunciado' como roles válidos en causa_partes
ALTER TABLE public.causa_partes
  DROP CONSTRAINT causa_partes_rol_check;

ALTER TABLE public.causa_partes
  ADD CONSTRAINT causa_partes_rol_check
  CHECK (rol IN (
    'actora', 'demandada',
    'requirente', 'requerido',
    'solicitante', 'solicitado',
    'denunciante', 'denunciado',
    'tercero', 'tercerista',
    'adquirente', 'citada_en_garantia', 'otro'
  ));
