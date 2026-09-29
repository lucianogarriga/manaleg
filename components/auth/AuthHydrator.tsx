"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

// Pasa el perfil leído en el servidor al store de Zustand
export default function AuthHydrator({ profile }: { profile: Profile }) {
  const setProfile = useAuthStore((s) => s.setProfile);

  useEffect(() => {
    setProfile(profile);
  }, [profile, setProfile]);

  return null;
}
