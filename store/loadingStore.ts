import { create } from "zustand";

interface LoadingState {
  pending: number;
  start: () => void;
  stop: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  pending: 0,
  start: () => set((s) => ({ pending: s.pending + 1 })),
  stop: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}));
