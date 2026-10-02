"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/services/supabase/client";
import type { CausaShareConUsuario, Evento, HonorarioConPagos, MovimientoConAutor } from "@/types";

interface Loaded<T> {
  causaId: string;
  data: T;
  error: string | null;
}

// Carga datos hijos de una causa con el cliente del navegador (RLS aplica).
// `reload()` vuelve a pedirlos, por ejemplo después de guardar algo.
function useCausaQuery<T>(
  causaId: string,
  empty: T,
  query: (supabase: ReturnType<typeof createClient>, causaId: string) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
) {
  const [result, setResult] = useState<Loaded<T> | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    query(createClient(), causaId).then(({ data, error }) => {
      if (!cancelled) setResult({ causaId, data: data ?? empty, error: error?.message ?? null });
    });
    return () => {
      cancelled = true;
    };
    // query y empty son constantes por hook; solo importan causa y versión
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [causaId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const ready = result !== null && result.causaId === causaId;

  return {
    data: ready ? result.data : empty,
    error: ready ? result.error : null,
    loading: !ready,
    reload,
  };
}

const EMPTY_MOVIMIENTOS: MovimientoConAutor[] = [];

export function useMovimientos(causaId: string) {
  return useCausaQuery<MovimientoConAutor[]>(causaId, EMPTY_MOVIMIENTOS, (supabase, id) =>
    supabase
      .from("movimientos")
      .select("*, autor:profiles!movimientos_autor_id_fkey(id, nombre_completo, email)")
      .eq("causa_id", id)
      .order("fecha", { ascending: false })
      .returns<MovimientoConAutor[]>(),
  );
}

const EMPTY_SHARES: CausaShareConUsuario[] = [];

// Usuarios con quienes está compartida la causa
export function useShares(causaId: string) {
  return useCausaQuery<CausaShareConUsuario[]>(causaId, EMPTY_SHARES, (supabase, id) =>
    supabase
      .from("causa_shares")
      .select("*, usuario:profiles!causa_shares_shared_with_user_id_fkey(id, nombre_completo, email)")
      .eq("causa_id", id)
      .order("created_at", { ascending: true })
      .returns<CausaShareConUsuario[]>(),
  );
}

const EMPTY_EVENTOS: Evento[] = [];

export function useEventos(causaId: string) {
  return useCausaQuery<Evento[]>(causaId, EMPTY_EVENTOS, (supabase, id) =>
    supabase
      .from("eventos")
      .select("*")
      .eq("causa_id", id)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true })
      .returns<Evento[]>(),
  );
}

// Una causa tiene un solo acuerdo de honorarios en la UI (el más antiguo)
export function useHonorario(causaId: string) {
  const { data, ...rest } = useCausaQuery<HonorarioConPagos[]>(causaId, [], (supabase, id) =>
    supabase
      .from("honorarios")
      .select("*, pagos(*, registrado_por:profiles!pagos_registrado_por_id_fkey(id, nombre_completo, email))")
      .eq("causa_id", id)
      .order("created_at", { ascending: true })
      .order("fecha_pago", { referencedTable: "pagos", ascending: false })
      .limit(1)
      .returns<HonorarioConPagos[]>(),
  );
  return { ...rest, honorario: data[0] ?? null };
}
