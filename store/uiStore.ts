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

  toast: Toast | null;
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: () => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),

  toast: null,
  showToast: (toast) => set({ toast: { ...toast, id: ++toastId } }),
  dismissToast: () => set({ toast: null }),
}));
