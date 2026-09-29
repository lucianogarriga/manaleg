"use client";

import { useAuthStore } from "@/store/authStore";

// Perfil del usuario logueado en Client Components.
// En Server Components usar getCurrentProfile() de AuthGuard.
export function useAuth() {
  const profile = useAuthStore((s) => s.profile);
  return { profile, userId: profile?.id ?? null };
}
