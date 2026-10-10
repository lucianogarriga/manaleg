-- ═══════════════════════════════════════════════════════════════
-- Rediseño de Partes
-- Reemplaza los campos texto parte_actora / parte_demandada por una
-- tabla normalizada causa_partes con rol, tipo de persona y datos del
-- abogado de cada parte.
-- ═══════════════════════════════════════════════════════════════

-- ─── Tabla principal ─────────────────────────────────────────────
CREATE TABLE public.causa_partes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id         uuid        NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  nombre           text        NOT NULL,
  tipo_persona     text        NOT NULL DEFAULT 'fisica'
                               CHECK (tipo_persona IN ('fisica', 'juridica')),
  rol              text        NOT NULL
                               CHECK (rol IN (
                                 'actora', 'demandada', 'solicitante', 'requirente',
                                 'solicitado', 'requerido', 'tercero', 'tercerista',
                                 'adquirente', 'otro'
                               )),
  es_nuestra_parte boolean     NOT NULL DEFAULT false,
  caracter_abogado text        CHECK (caracter_abogado IN ('apoderado', 'patrocinante')),
  orden            integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.causa_partes (causa_id);

-- ─── RLS ────────────────────────────────────────────────────────
ALTER TABLE public.causa_partes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "causa_partes_select" ON public.causa_partes
  FOR SELECT TO authenticated
  USING (private.user_can_access_causa(causa_id));

CREATE POLICY "causa_partes_insert" ON public.causa_partes
  FOR INSERT TO authenticated
  WITH CHECK (private.user_can_access_causa(causa_id));

CREATE POLICY "causa_partes_update" ON public.causa_partes
  FOR UPDATE TO authenticated
  USING  (private.user_can_access_causa(causa_id))
  WITH CHECK (private.user_can_access_causa(causa_id));

CREATE POLICY "causa_partes_delete" ON public.causa_partes
  FOR DELETE TO authenticated
  USING (private.user_can_access_causa(causa_id));

-- ─── Permisos ────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.causa_partes TO authenticated;

-- ─── Migrar datos existentes ─────────────────────────────────────

-- parte_actora → rol 'actora', orden 0
INSERT INTO public.causa_partes (causa_id, nombre, tipo_persona, rol, orden)
SELECT id, parte_actora, 'fisica', 'actora', 0
FROM public.causas
WHERE parte_actora IS NOT NULL AND parte_actora <> '';

-- parte_demandada (puede ser múltiples separados por '\n') → rol 'demandada'
INSERT INTO public.causa_partes (causa_id, nombre, tipo_persona, rol, orden)
SELECT
  c.id,
  trim(d.nombre),
  'fisica',
  'demandada',
  (d.ord - 1)::integer
FROM public.causas c,
     unnest(string_to_array(c.parte_demandada, E'\n')) WITH ORDINALITY AS d(nombre, ord)
WHERE c.parte_demandada IS NOT NULL
  AND c.parte_demandada <> ''
  AND trim(d.nombre) <> '';
