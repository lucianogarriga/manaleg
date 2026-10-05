import { create } from "zustand";

export type CausasFilter = "todas" | "mias" | "compartidas" | "urgentes" | "cerradas" | "vencen_hoy" | "vencen_3dias" | "sin_movimiento";

interface CausasState {
  selectedId: string | null;
  filter: CausasFilter;
  search: string; // lo escribe el buscador del Topbar
  formOpen: boolean;
  editingId: string | null; // null = crear nueva
  select: (id: string | null) => void;
  setFilter: (filter: CausasFilter) => void;
  setSearch: (search: string) => void;
  openCreate: () => void;
  openEdit: (id: string) => void;
  closeForm: () => void;
}

export const useCausasStore = create<CausasState>((set) => ({
  selectedId: null,
  filter: "todas",
  search: "",
  formOpen: false,
  editingId: null,
  select: (selectedId) => set({ selectedId }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  openCreate: () => set({ formOpen: true, editingId: null }),
  openEdit: (id) => set({ formOpen: true, editingId: id }),
  closeForm: () => set({ formOpen: false, editingId: null }),
}));
