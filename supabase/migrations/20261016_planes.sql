-- ═══════════════════════════════════════════════════════════════
-- Tabla de planes: los límites de adjuntos viven en la base, no en el código.
-- Cambiar un límite o agregar un plan es una fila nueva, sin publicar código.
-- Valores de referencia (revisables antes de lanzar):
--   causa_adjuntos_mb: cuota de adjuntos por causa (cuenta contra el titular)
--   total_adjuntos_mb: cuota total por usuario (titular)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.planes (
  codigo              TEXT PRIMARY KEY CHECK (codigo ~ '^[a-z]+$'),
  nombre              TEXT NOT NULL,
  orden               INTEGER NOT NULL,
  adjunto_max_mb      INTEGER NOT NULL CHECK (adjunto_max_mb > 0),
  causa_adjuntos_mb   INTEGER NOT NULL CHECK (causa_adjuntos_mb >= 0),
  total_adjuntos_mb   INTEGER NOT NULL CHECK (total_adjuntos_mb >= 0)
);

INSERT INTO public.planes (codigo, nombre, orden, adjunto_max_mb, causa_adjuntos_mb, total_adjuntos_mb) VALUES
  ('free',       'Free',       1, 5, 10,  10),
  ('plus',       'Plus',       2, 5, 50,  200),
  ('pro',        'Pro',        3, 5, 100, 1024),
  ('full',       'Full',       4, 5, 100, 3072)
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;

-- Lectura pública de los planes (son datos de precios y límites, no privados).
-- Nadie escribe desde el navegador: solo el panel de Supabase o el service role.
DROP POLICY IF EXISTS "planes_select" ON public.planes;
CREATE POLICY "planes_select" ON public.planes
  FOR SELECT TO anon, authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.planes FROM anon, authenticated;

-- El plan de cada usuario debe existir en la tabla. NOT VALID: exige el valor en
-- toda escritura nueva sin revisar filas anteriores.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_existe;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_existe
  FOREIGN KEY (plan) REFERENCES public.planes (codigo) NOT VALID;
