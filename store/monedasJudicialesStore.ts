import { create } from "zustand";
import type { MonedaJudicial } from "@/types";

interface MonedasState {
  monedas: MonedaJudicial[];
  cargado: boolean;
  setMonedas: (monedas: MonedaJudicial[]) => void;
}

// Monedas judiciales del usuario (JUS, UMA, otras). Se cargan la primera vez que alguna pantalla las pide.
export const useMonedasJudiciales = create<MonedasState>((set) => ({
  monedas: [],
  cargado: false,
  setMonedas: (monedas) => set({ monedas, cargado: true }),
}));
