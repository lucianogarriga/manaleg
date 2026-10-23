-- Alinea las restricciones de la base con las listas de la app:
-- 1) vía de proceso "Defensa del Consumidor" (faltaba y el alta fallaba con causas_via_proceso_check)
-- 2) etapas procesales de vías no judiciales (mediación, consumidor, administrativo, extrajudicial)
-- 3) fueros "Estafa virtual" y "Phishing" pasan a "Ciberdelitos"

ALTER TABLE public.causas DROP CONSTRAINT IF EXISTS causas_via_proceso_check;
ALTER TABLE public.causas
  ADD CONSTRAINT causas_via_proceso_check
  CHECK (via_proceso IN ('Judicial', 'Mediación', 'Defensa del Consumidor', 'Administrativo', 'Extrajudicial'));

ALTER TABLE public.causas DROP CONSTRAINT IF EXISTS causas_etapa_procesal_check;
ALTER TABLE public.causas
  ADD CONSTRAINT causas_etapa_procesal_check
  CHECK (etapa_procesal IN (
    'Inicial', 'Prueba', 'Alegatos', 'Sentencia', 'Ejecución',
    'Audiencia de mediación', 'Propuesta', 'Cierre',
    'Reclamo', 'Audiencia de conciliación', 'Resolución', 'Apelación',
    'Reclamo administrativo', 'Instrucción', 'Recurso',
    'Negociación', 'Intimación'
  ));

UPDATE public.causas
SET fuero = 'Ciberdelitos'
WHERE fuero IN ('Estafa virtual', 'Phishing');
