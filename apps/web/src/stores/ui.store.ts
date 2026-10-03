import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  /** Sidebar collapse state */
  sidebarCollapsed: boolean;
  /** Active modal ID (null = no modal) */
  activeModal: string | null;
  /** Global search query */
  searchQuery: string;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  setSearchQuery: (query: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeModal: null,
      searchQuery: '',

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      openModal: (id) => set({ activeModal: id }),

      closeModal: () => set({ activeModal: null }),

      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'ocj_ui_v1',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
