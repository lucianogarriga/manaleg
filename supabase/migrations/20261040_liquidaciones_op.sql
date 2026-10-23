-- Planillas de liquidación y órdenes de pago de causas judiciales.
-- Los rubros y las imputaciones van en jsonb: son listas chicas que siempre se leen junto con su padre.

CREATE TABLE IF NOT EXISTS public.liquidaciones (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id          uuid        NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  fecha             date        NOT NULL DEFAULT current_date,
  descripcion       text,
  rubros            jsonb       NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(rubros) = 'array'),
  aprobada          boolean     NOT NULL DEFAULT false,
  fecha_aprobacion  date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS liquidaciones_causa_idx ON public.liquidaciones (causa_id);

CREATE TABLE IF NOT EXISTS public.ordenes_pago (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id      uuid          NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  numero        text          NOT NULL,
  fecha         date          NOT NULL DEFAULT current_date,
  monto         numeric(14,2) NOT NULL CHECK (monto > 0),
  beneficiario  text,
  estado        text          NOT NULL DEFAULT 'Librada' CHECK (estado IN ('Librada', 'Procesada')),
  imputaciones  jsonb         NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(imputaciones) = 'array'),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ordenes_pago_causa_idx ON public.ordenes_pago (causa_id);

-- Acceso: leen el titular y los colegas con la causa compartida; escriben solo el titular
ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_pago  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "liquidaciones_select" ON public.liquidaciones
  FOR SELECT USING (private.user_can_access_causa(causa_id));
CREATE POLICY "liquidaciones_insert" ON public.liquidaciones
  FOR INSERT WITH CHECK (private.user_owns_causa(causa_id));
CREATE POLICY "liquidaciones_update" ON public.liquidaciones
  FOR UPDATE USING (private.user_owns_causa(causa_id)) WITH CHECK (private.user_owns_causa(causa_id));
CREATE POLICY "liquidaciones_delete" ON public.liquidaciones
  FOR DELETE USING (private.user_owns_causa(causa_id));

CREATE POLICY "ordenes_pago_select" ON public.ordenes_pago
  FOR SELECT USING (private.user_can_access_causa(causa_id));
CREATE POLICY "ordenes_pago_insert" ON public.ordenes_pago
  FOR INSERT WITH CHECK (private.user_owns_causa(causa_id));
CREATE POLICY "ordenes_pago_update" ON public.ordenes_pago
  FOR UPDATE USING (private.user_owns_causa(causa_id)) WITH CHECK (private.user_owns_causa(causa_id));
CREATE POLICY "ordenes_pago_delete" ON public.ordenes_pago
  FOR DELETE USING (private.user_owns_causa(causa_id));
