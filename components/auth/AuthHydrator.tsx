"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

// Pasa el perfil leído en el servidor al store de Zustand y aplica la paleta del usuario
export default function AuthHydrator({ profile }: { profile: Profile }) {
  const setProfile = useAuthStore((s) => s.setProfile);
  const paletaInicial = useRef(profile.paleta);

  useEffect(() => {
    setProfile(profile);
  }, [profile, setProfile]);

  // Solo al cargar: una revalidación del layout puede traer una paleta anterior a la elegida
  useEffect(() => {
    document.documentElement.setAttribute("data-palette", paletaInicial.current);
  }, []);

  return null;
}
