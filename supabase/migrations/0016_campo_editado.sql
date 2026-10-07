-- Registra qué sección/campo fue la última en modificarse en cada causa
ALTER TABLE public.causas ADD COLUMN IF NOT EXISTS campo_editado text NULL;
