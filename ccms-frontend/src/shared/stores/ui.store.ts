import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
  activeModal: { id: string; props: Record<string, unknown> } | null
  commandPaletteOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  openModal: (id: string, props?: Record<string, unknown>) => void
  closeModal: () => void
  toggleCommandPalette: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      activeModal: null,
      commandPaletteOpen: false,
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setTheme: (theme) => set({ theme }),
      openModal: (id, props = {}) => set({ activeModal: { id, props } }),
      closeModal: () => set({ activeModal: null }),
      toggleCommandPalette: () =>
        set({ commandPaletteOpen: !get().commandPaletteOpen }),
    }),
    {
      name: 'ccms-ui-prefs',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
)
