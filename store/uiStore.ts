import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string; // botón opcional dentro del aviso
  onAction?: () => void;
}

interface UIState {
  sidebarOpen: boolean; // drawer en mobile
  openSidebar: () => void;
  closeSidebar: () => void;

  sidebarPinned: boolean; // desktop: fijo expandido
  toggleSidebarPin: () => void;

  toast: Toast | null;
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: () => void;
}

let toastId = 0;

const loadPin = () => {
  try { return localStorage.getItem("sidebar-pinned") === "true"; } catch { return false; }
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),

  sidebarPinned: false, // hydrated client-side in Sidebar
  toggleSidebarPin: () =>
    set((s) => {
      const next = !s.sidebarPinned;
      try { localStorage.setItem("sidebar-pinned", String(next)); } catch {}
      return { sidebarPinned: next };
    }),

  toast: null,
  showToast: (toast) => set({ toast: { ...toast, id: ++toastId } }),
  dismissToast: () => set({ toast: null }),
}));

export { loadPin };
