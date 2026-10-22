"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

// Pasa el perfil leído en el servidor al store de Zustand y aplica la paleta del usuario
export default function AuthHydrator({ profile }: { profile: Profile }) {
  const setProfile = useAuthStore((s) => s.setProfile);
  const paletaInicial = useRef(profile.paleta);
  const movimientoInicial = useRef(profile.reducir_movimiento);

  useEffect(() => {
    setProfile(profile);
  }, [profile, setProfile]);

  // Solo al cargar: una revalidación del layout puede traer una paleta anterior a la elegida
  useEffect(() => {
    document.documentElement.setAttribute("data-palette", paletaInicial.current);
    if (movimientoInicial.current) document.documentElement.dataset.motion = "off";
    // Copia local para que el próximo F5 aplique la misma paleta antes de pintar (ver layout.tsx)
    try {
      localStorage.setItem("palette", paletaInicial.current);
      if (movimientoInicial.current) localStorage.setItem("motion", "off");
      else localStorage.removeItem("motion");
    } catch {}
  }, []);

  return null;
}
