"use client";

import { useEffect, useState } from "react";
import { suscribirPresencia, type PresenceUser } from "@/services/presence/canalesCausa";
import { getInitials } from "@/utils/formatters";

export type { PresenceUser };

// Se anuncia en la causa (si `anunciar` está activo) y devuelve quiénes más la tienen abierta.
export function usePresence(
  causaId: string | null,
  currentUserId: string,
  currentNombre: string | null,
  anunciar = true,
): PresenceUser[] {
  const [online, setOnline] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!causaId || !currentUserId) return;
    const yo: PresenceUser | undefined = anunciar
      ? {
          user_id: currentUserId,
          nombre: currentNombre ?? "Usuario",
          initials: getInitials(currentNombre, currentUserId[0]?.toUpperCase()),
        }
      : undefined;
    return suscribirPresencia(causaId, currentUserId, setOnline, yo);
  }, [causaId, currentUserId, currentNombre, anunciar]);

  return online;
}
