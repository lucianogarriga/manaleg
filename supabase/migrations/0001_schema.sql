-- ═══════════════════════════════════════════════════════════════
-- MANALEG — Schema inicial
-- Ejecutar completo en Supabase → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════


-- ─── UTIL: mantener updated_at ───
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ═══ TABLAS ════════════════════════════════════════════════════

-- ─── PROFILES (extensión de auth.users) ───
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT,
  empresa TEXT,
  plan TEXT DEFAULT 'free',          -- 'free' | 'pro'
  estado_pago TEXT DEFAULT 'prueba', -- 'activo' | 'vencido' | 'prueba'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLIENTES ───
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  dni_cuit TEXT,
  telefono TEXT,
  email TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CAUSAS ───
CREATE TABLE public.causas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE, -- owner
  caratula TEXT NOT NULL,
  nro_expediente TEXT,
  tipo_causa TEXT,  -- Civil | Comercial | Laboral | Contencioso-Adm | Extrajudicial | Administrativo
  fuero TEXT,
  juzgado_camara TEXT,
  parte_actora TEXT,
  parte_demandada TEXT,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'Iniciada',  -- Iniciada | En trámite | Con resolución | En ejecución | Cerrada
  fecha_inicio DATE,
  proximo_vencimiento DATE,
  tipo_vencimiento TEXT,
  anticipacion_alerta TEXT DEFAULT '1 día',  -- 1 día | 3 días | 1 semana
  inactividad_dias INTEGER DEFAULT 7,
  monto_reclamado DECIMAL(15,2),
  link_drive TEXT,
  notas TEXT,
  fecha_ultimo_movimiento DATE,
  ultimo_editor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CAUSA_SHARES (acceso compartido) ───
CREATE TABLE public.causa_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (causa_id, shared_with_user_id),
  CHECK (shared_with_user_id <> invited_by_user_id)
);

-- ─── MOVIMIENTOS ───
CREATE TABLE public.movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  tipo TEXT,  -- Presentación | Llamada | Resolución | Audiencia | Pago | Otro
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VENCIMIENTOS ───
CREATE TABLE public.vencimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  creado_por_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  fecha_vencimiento DATE NOT NULL,
  descripcion TEXT NOT NULL,
  tipo TEXT,  -- Plazo procesal | Audiencia | Prescripción | Pacto honorarios | Otro
  estado_alerta TEXT DEFAULT 'Pendiente',  -- Pendiente | Notificado | Vencido
  anticipacion TEXT DEFAULT '1 día',       -- 1 día | 3 días | 1 semana
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HONORARIOS ───
CREATE TABLE public.honorarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  creado_por_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  monto_acordado DECIMAL(15,2) NOT NULL DEFAULT 0,
  porcentaje DECIMAL(5,2),
  fecha_pacto DATE,
  monto_cobrado DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo_pendiente DECIMAL(15,2) GENERATED ALWAYS AS (monto_acordado - monto_cobrado) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAGOS ───
CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  honorario_id UUID NOT NULL REFERENCES public.honorarios(id) ON DELETE CASCADE,
  causa_id UUID NOT NULL REFERENCES public.causas(id) ON DELETE CASCADE,
  registrado_por_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  monto DECIMAL(15,2) NOT NULL CHECK (monto > 0),
  descripcion TEXT,
  comprobante_drive TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para las FKs más consultadas
CREATE INDEX ON public.clientes (user_id);
CREATE INDEX ON public.causas (user_id);
CREATE INDEX ON public.causas (cliente_id);
CREATE INDEX ON public.causa_shares (shared_with_user_id);
CREATE INDEX ON public.movimientos (causa_id);
CREATE INDEX ON public.vencimientos (causa_id);
CREATE INDEX ON public.honorarios (causa_id);
CREATE INDEX ON public.pagos (honorario_id);
CREATE INDEX ON public.pagos (causa_id);


-- ═══ HELPERS DE ACCESO ═════════════════════════════════════════
-- SECURITY DEFINER: consultan sin pasar por RLS, así las policies
-- de causas y causa_shares no se llaman entre sí (evita recursión).

CREATE OR REPLACE FUNCTION public.user_can_access_causa(causa_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.causas
    WHERE id = causa_uuid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.causa_shares
    WHERE causa_id = causa_uuid AND shared_with_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_causa(causa_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.causas
    WHERE id = causa_uuid AND user_id = auth.uid()
  );
$$;


-- ═══ ROW LEVEL SECURITY ════════════════════════════════════════

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causa_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vencimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honorarios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos        ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ───
-- Lectura: cualquier usuario logueado (para mostrar nombres de colaboradores
-- y buscar por email al compartir). El alta la hace el trigger de signup.
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─── CLIENTES (solo el dueño) ───
CREATE POLICY "clientes_owner" ON public.clientes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── CAUSAS ───
CREATE POLICY "causas_select" ON public.causas
  FOR SELECT TO authenticated USING (public.user_can_access_causa(id));

CREATE POLICY "causas_insert" ON public.causas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "causas_update" ON public.causas
  FOR UPDATE TO authenticated
  USING (public.user_can_access_causa(id))
  WITH CHECK (public.user_can_access_causa(id));

CREATE POLICY "causas_delete" ON public.causas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── CAUSA_SHARES ───
CREATE POLICY "causa_shares_select" ON public.causa_shares
  FOR SELECT TO authenticated
  USING (
    auth.uid() = shared_with_user_id
    OR public.user_can_access_causa(causa_id)  -- colaboradores ven quién más tiene acceso
  );

CREATE POLICY "causa_shares_insert" ON public.causa_shares
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = invited_by_user_id AND public.user_owns_causa(causa_id));

CREATE POLICY "causa_shares_delete" ON public.causa_shares
  FOR DELETE TO authenticated USING (public.user_owns_causa(causa_id));

-- ─── MOVIMIENTOS ───
CREATE POLICY "movimientos_select" ON public.movimientos
  FOR SELECT TO authenticated USING (public.user_can_access_causa(causa_id));

CREATE POLICY "movimientos_insert" ON public.movimientos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = autor_id AND public.user_can_access_causa(causa_id));

-- Solo el autor edita/borra su propio movimiento
CREATE POLICY "movimientos_update" ON public.movimientos
  FOR UPDATE TO authenticated
  USING (auth.uid() = autor_id)
  WITH CHECK (auth.uid() = autor_id AND public.user_can_access_causa(causa_id));

CREATE POLICY "movimientos_delete" ON public.movimientos
  FOR DELETE TO authenticated USING (auth.uid() = autor_id);

-- ─── VENCIMIENTOS ───
CREATE POLICY "vencimientos_select" ON public.vencimientos
  FOR SELECT TO authenticated USING (public.user_can_access_causa(causa_id));

CREATE POLICY "vencimientos_insert" ON public.vencimientos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creado_por_id AND public.user_can_access_causa(causa_id));

CREATE POLICY "vencimientos_update" ON public.vencimientos
  FOR UPDATE TO authenticated
  USING (public.user_can_access_causa(causa_id))
  WITH CHECK (public.user_can_access_causa(causa_id));

CREATE POLICY "vencimientos_delete" ON public.vencimientos
  FOR DELETE TO authenticated USING (public.user_can_access_causa(causa_id));

-- ─── HONORARIOS ───
CREATE POLICY "honorarios_select" ON public.honorarios
  FOR SELECT TO authenticated USING (public.user_can_access_causa(causa_id));

CREATE POLICY "honorarios_insert" ON public.honorarios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creado_por_id AND public.user_can_access_causa(causa_id));

CREATE POLICY "honorarios_update" ON public.honorarios
  FOR UPDATE TO authenticated
  USING (public.user_can_access_causa(causa_id))
  WITH CHECK (public.user_can_access_causa(causa_id));

CREATE POLICY "honorarios_delete" ON public.honorarios
  FOR DELETE TO authenticated USING (public.user_can_access_causa(causa_id));

-- ─── PAGOS ───
CREATE POLICY "pagos_select" ON public.pagos
  FOR SELECT TO authenticated USING (public.user_can_access_causa(causa_id));

CREATE POLICY "pagos_insert" ON public.pagos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = registrado_por_id AND public.user_can_access_causa(causa_id));

CREATE POLICY "pagos_update" ON public.pagos
  FOR UPDATE TO authenticated
  USING (public.user_can_access_causa(causa_id))
  WITH CHECK (public.user_can_access_causa(causa_id));

CREATE POLICY "pagos_delete" ON public.pagos
  FOR DELETE TO authenticated USING (public.user_can_access_causa(causa_id));


-- ═══ TRIGGERS ══════════════════════════════════════════════════

-- ─── Alta automática de profile al registrarse ───
-- Toma nombre_completo de los metadatos enviados en signUp({ options: { data } })
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'nombre_completo');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── updated_at ───
CREATE TRIGGER profiles_updated_at   BEFORE UPDATE ON public.profiles   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clientes_updated_at   BEFORE UPDATE ON public.clientes   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER honorarios_updated_at BEFORE UPDATE ON public.honorarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Causas: proteger owner + registrar último editor ───
-- Un colaborador puede editar la causa pero nunca cambiar su owner.
-- ultimo_editor_id se completa solo: el frontend no necesita enviarlo.
CREATE OR REPLACE FUNCTION public.before_causa_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'No se puede cambiar el owner de una causa';
  END IF;
  NEW.updated_at = NOW();
  NEW.ultimo_editor_id = COALESCE(auth.uid(), NEW.ultimo_editor_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER causas_before_update
  BEFORE UPDATE ON public.causas
  FOR EACH ROW EXECUTE FUNCTION public.before_causa_update();

-- ─── Movimiento nuevo → actualiza la causa ───
CREATE OR REPLACE FUNCTION public.update_causa_on_movimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.causas
  SET fecha_ultimo_movimiento = GREATEST(
        COALESCE(fecha_ultimo_movimiento, NEW.fecha::DATE),
        NEW.fecha::DATE
      ),
      ultimo_editor_id = NEW.autor_id
  WHERE id = NEW.causa_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_movimiento_added
  AFTER INSERT ON public.movimientos
  FOR EACH ROW EXECUTE FUNCTION public.update_causa_on_movimiento();

-- ─── Pagos → recalcula monto_cobrado del honorario ───
CREATE OR REPLACE FUNCTION public.update_monto_cobrado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  hid UUID;
BEGIN
  FOREACH hid IN ARRAY ARRAY[OLD.honorario_id, NEW.honorario_id] LOOP
    IF hid IS NOT NULL THEN
      UPDATE public.honorarios
      SET monto_cobrado = (
        SELECT COALESCE(SUM(monto), 0) FROM public.pagos WHERE honorario_id = hid
      )
      WHERE id = hid;
    END IF;
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_pago_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.update_monto_cobrado();


-- ═══ PERMISOS DATA API ═════════════════════════════════════════
-- Solo usuarios logueados acceden; RLS filtra las filas.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_causa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_causa(UUID) TO authenticated;
