"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/services/supabase/client";

export interface PresenceUser {
  user_id: string;
  nombre: string;
  initials: string;
}

type Escucha = (otros: PresenceUser[]) => void;

interface Entrada {
  canal: RealtimeChannel;
  escuchas: Map<symbol, { userId: string; fn: Escucha }>;
  yoTrackeado: Map<symbol, PresenceUser>;
  listo: boolean;
}

// Un solo canal por causa, compartido entre el detalle (que se anuncia) y el listado (que solo escucha).
// Dos canales con el mismo nombre en el mismo cliente se pisan entre sí, por eso se comparten.
const entradas = new Map<string, Entrada>();

// Escucha quién está en la causa. Si se pasa `yo`, además se anuncia en el canal.
// Devuelve la función para dejar de escuchar.
export function suscribirPresencia(causaId: string, userId: string, fn: Escucha, yo?: PresenceUser): () => void {
  let entrada = entradas.get(causaId);
  if (!entrada) {
    const supabase = createClient();
    const canal = supabase.channel(`causa-presence:${causaId}`, {
      config: { private: true, presence: { key: userId } },
    });
    const nueva: Entrada = { canal, escuchas: new Map(), yoTrackeado: new Map(), listo: false };
    canal.on("presence", { event: "sync" }, () => {
      const state = canal.presenceState<PresenceUser>();
      const todos = Object.entries(state).map(([, arr]) => arr[0]).filter(Boolean) as PresenceUser[];
      for (const e of nueva.escuchas.values()) {
        emitirSinMi(e, todos);
      }
    });
    canal.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      nueva.listo = true;
      for (const t of nueva.yoTrackeado.values()) await canal.track(t);
    });
    entradas.set(causaId, nueva);
    entrada = nueva;
  }

  const actual = entrada;
  const id = Symbol();
  actual.escuchas.set(id, { userId, fn });
  if (yo) {
    actual.yoTrackeado.set(id, yo);
    if (actual.listo) void actual.canal.track(yo);
  }

  return () => {
    actual.escuchas.delete(id);
    if (actual.yoTrackeado.delete(id) && actual.listo) void actual.canal.untrack();
    if (actual.escuchas.size === 0) {
      createClient().removeChannel(actual.canal);
      if (entradas.get(causaId) === actual) entradas.delete(causaId);
    }
  };
}

// Cada escucha ve a los demás, no a sí misma
function emitirSinMi(e: { userId: string; fn: Escucha }, todos: PresenceUser[]) {
  e.fn(todos.filter((u) => u.user_id !== e.userId));
}
