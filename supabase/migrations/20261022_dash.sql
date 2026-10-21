-- ═══════════════════════════════════════════════════════════════
-- Datos para el dashboard (Novedades y KPIs):
--   · profiles.preferencia_graficos: Barras | Ondas, por usuario.
--   · causas: etapa procesal y resultado (ganada, transada, perdida).
--   · causa_etapas: historial de etapas, para "días promedio por etapa".
--   · vencimientos.completado_at: fecha de cumplimiento, para "plazos a tiempo".
--   · gastos.reintegrado: para "gastos sin reintegrar".
-- ═══════════════════════════════════════════════════════════════

-- 1) Preferencia de gráficos. El usuario solo puede cambiar esta columna.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferencia_graficos TEXT NOT NULL DEFAULT 'barras'
    CHECK (preferencia_graficos IN ('barras', 'ondas'));

GRANT UPDATE (preferencia_graficos) ON public.profiles TO authenticated;

-- 2) Etapa procesal y resultado de la causa.
ALTER TABLE public.causas
  ADD COLUMN IF NOT EXISTS etapa_procesal TEXT
    CHECK (etapa_procesal IN ('Inicial', 'Prueba', 'Alegatos', 'Sentencia', 'Ejecución')),
  ADD COLUMN IF NOT EXISTS resultado TEXT
    CHECK (resultado IN ('Ganada', 'Transada', 'Perdida')),
  ADD COLUMN IF NOT EXISTS resultado_fecha DATE;

-- 3) Historial de etapas: cada fila es un período en una etapa.
CREATE TABLE IF NOT EXISTS public.causa_etapas (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  etapa    TEXT NOT NULL,
  desde    DATE NOT NULL,
  hasta    DATE
);

CREATE INDEX IF NOT EXISTS causa_etapas_causa_idx ON public.causa_etapas (causa_id);

ALTER TABLE public.causa_etapas ENABLE ROW LEVEL SECURITY;

-- Solo se lee; las filas las escribe el trigger, no el cliente.
CREATE POLICY "causa_etapas_select" ON public.causa_etapas
  FOR SELECT TO authenticated
  USING (private.user_can_access_causa(causa_id));

REVOKE ALL ON public.causa_etapas FROM anon;
GRANT SELECT ON public.causa_etapas TO authenticated;

CREATE OR REPLACE FUNCTION public.registrar_etapa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.etapa_procesal IS NOT NULL THEN
      INSERT INTO public.causa_etapas (causa_id, etapa, desde)
      VALUES (NEW.id, NEW.etapa_procesal, current_date);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.etapa_procesal IS DISTINCT FROM OLD.etapa_procesal THEN
    UPDATE public.causa_etapas
       SET hasta = current_date
     WHERE causa_id = NEW.id AND hasta IS NULL;

    IF NEW.etapa_procesal IS NOT NULL THEN
      INSERT INTO public.causa_etapas (causa_id, etapa, desde)
      VALUES (NEW.id, NEW.etapa_procesal, current_date);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER causas_registrar_etapa
  AFTER INSERT OR UPDATE OF etapa_procesal ON public.causas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_etapa();

-- 4) Fecha de cumplimiento de los vencimientos.
ALTER TABLE public.vencimientos
  ADD COLUMN IF NOT EXISTS completado_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.marcar_completado_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.completado THEN
    -- Alta ya completado, o paso de pendiente a completado.
    IF TG_OP = 'INSERT' THEN
      NEW.completado_at := now();
    ELSIF NOT OLD.completado THEN
      NEW.completado_at := now();
    END IF;
  ELSE
    NEW.completado_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER vencimientos_completado_at
  BEFORE INSERT OR UPDATE OF completado ON public.vencimientos
  FOR EACH ROW EXECUTE FUNCTION public.marcar_completado_at();

-- 5) Gastos reintegrados por el cliente.
ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS reintegrado BOOLEAN NOT NULL DEFAULT false;
