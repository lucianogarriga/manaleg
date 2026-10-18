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

// Solo escucha: para el listado, que muestra quién tiene abierta cada causa.
export function useEnLineaPorCausa(causaIds: string[], currentUserId: string): Record<string, PresenceUser[]> {
  const [mapa, setMapa] = useState<Record<string, PresenceUser[]>>({});
  const clave = causaIds.join(",");

  useEffect(() => {
    if (!currentUserId || causaIds.length === 0) return;
    const cancelar = causaIds.map((id) =>
      suscribirPresencia(id, currentUserId, (otros) => setMapa((prev) => ({ ...prev, [id]: otros }))),
    );
    return () => cancelar.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, currentUserId]);

  return mapa;
}
