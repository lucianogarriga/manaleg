"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/services/supabase/client";
import { getInitials } from "@/utils/formatters";

export interface PresenceUser {
  user_id: string;
  nombre: string;
  initials: string;
}

// Conecta al canal de presencia de una causa y devuelve la lista
// de otros usuarios que la tienen abierta en este momento.
export function usePresence(
  causaId: string | null,
  currentUserId: string,
  currentNombre: string | null,
): PresenceUser[] {
  const [online, setOnline] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!causaId || !currentUserId) return;

    const supabase = createClient();
    const myPayload: PresenceUser = {
      user_id: currentUserId,
      nombre: currentNombre ?? "Usuario",
      initials: getInitials(currentNombre, currentUserId[0]?.toUpperCase()),
    };

    const channel = supabase.channel(`causa-presence:${causaId}`, {
      config: { private: true, presence: { key: currentUserId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceUser>();
      const others = Object.entries(state)
        .filter(([key]) => key !== currentUserId)
        .map(([, arr]) => arr[0])
        .filter(Boolean) as PresenceUser[];
      setOnline(others);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(myPayload);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [causaId, currentUserId, currentNombre]);

  return online;
}
