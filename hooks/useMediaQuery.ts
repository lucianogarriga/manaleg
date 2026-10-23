"use client";

import { useEffect, useState } from "react";

// Devuelve si la media query coincide, y se actualiza al cambiar el tamaño de la pantalla.
export function useMediaQuery(query: string): boolean {
  const [coincide, setCoincide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sincronizar = () => setCoincide(media.matches);
    sincronizar();
    media.addEventListener("change", sincronizar);
    return () => media.removeEventListener("change", sincronizar);
  }, [query]);

  return coincide;
}
