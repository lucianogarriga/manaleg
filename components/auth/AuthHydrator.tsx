"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

// Pasa el perfil leído en el servidor al store de Zustand y aplica la paleta del usuario
export default function AuthHydrator({ profile }: { profile: Profile }) {
  const setProfile = useAuthStore((s) => s.setProfile);

  useEffect(() => {
    setProfile(profile);
    document.documentElement.setAttribute("data-palette", profile.paleta);
  }, [profile, setProfile]);

  return null;
}
