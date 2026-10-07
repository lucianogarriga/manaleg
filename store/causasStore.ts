import { create } from "zustand";

export type CausasFilter = "todas" | "mias" | "compartidas" | "urgentes" | "cerradas" | "vencen_hoy" | "vencen_3dias" | "sin_movimiento" | "audiencias" | "recordatorios" | "vencimientos";

// Filtros visibles en los chips de la UI (subset de CausasFilter)
export const VISIBLE_FILTERS = new Set<CausasFilter>(["todas", "mias", "compartidas", "urgentes", "recordatorios", "cerradas"]);

interface CausasState {
  selectedId: string | null;
  filter: CausasFilter;
  search: string; // lo escribe el buscador del Topbar
  fueros: Set<string>; // multi-select: JUD, EXT, ADM, MED, DEF
  tipoJuicio: string | null; // filtro por tipo de juicio
  formOpen: boolean;
  editingId: string | null; // null = crear nueva
  select: (id: string | null) => void;
  setFilter: (filter: CausasFilter) => void;
  setSearch: (search: string) => void;
  toggleFuero: (fuero: string) => void;
  setTipoJuicio: (tipo: string | null) => void;
  clearAdvancedFilters: () => void;
  openCreate: () => void;
  openEdit: (id: string) => void;
  closeForm: () => void;
}

export const useCausasStore = create<CausasState>((set, get) => ({
  selectedId: null,
  filter: "todas",
  search: "",
  fueros: new Set(),
  tipoJuicio: null,
  formOpen: false,
  editingId: null,
  select: (selectedId) => set({ selectedId }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  toggleFuero: (fuero) => {
    const next = new Set(get().fueros);
    if (next.has(fuero)) next.delete(fuero); else next.add(fuero);
    set({ fueros: next });
  },
  setTipoJuicio: (tipoJuicio) => set({ tipoJuicio }),
  clearAdvancedFilters: () => set({ fueros: new Set(), tipoJuicio: null }),
  openCreate: () => set({ formOpen: true, editingId: null }),
  openEdit: (id) => set({ formOpen: true, editingId: id }),
  closeForm: () => set({ formOpen: false, editingId: null }),
}));
