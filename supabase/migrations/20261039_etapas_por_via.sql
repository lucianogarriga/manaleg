-- Etapas procesales por vía (lista definitiva). Reemplaza la restricción de etapa completa.
-- Se mantienen los valores anteriores para no romper causas que ya los tengan cargados.
ALTER TABLE public.causas DROP CONSTRAINT IF EXISTS causas_etapa_procesal_check;
ALTER TABLE public.causas
  ADD CONSTRAINT causas_etapa_procesal_check
  CHECK (etapa_procesal IN (
    -- Judicial
    'Inicial', 'Prueba', 'Alegatos', 'Sentencia', 'Ejecución',
    -- Mediación
    'Iniciada', 'Audiencia de mediación', 'Propuesta', 'Cierre',
    -- Defensa del consumidor
    'Reclamo', 'Audiencia de conciliación', 'Resolución/Acta de cierre',
    -- Administrativo
    'Reclamo administrativo', 'Peritaje', 'Resolución',
    -- Extrajudicial
    'Negociación', 'Intimación',
    -- Valores anteriores, por compatibilidad
    'Apelación', 'Instrucción', 'Recurso'
  ));
