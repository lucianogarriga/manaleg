-- Agrega el campo via_proceso a causas (tipo de proceso judicial/extrajudicial)
ALTER TABLE public.causas
  ADD COLUMN IF NOT EXISTS via_proceso text
  CHECK (via_proceso IN ('Judicial','Mediación','Administrativo','Extrajudicial'));
