import { create } from "zustand";
import type { Profile } from "@/types";

interface AuthState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
}

// Perfil del usuario logueado, disponible en Client Components.
// Lo completa <AuthHydrator> desde el layout protegido.
export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
