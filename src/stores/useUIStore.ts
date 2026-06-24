import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UnitsViewMode = 'board' | 'list'
export type LeasingViewMode = 'board' | 'list'

interface UIStore {
  sidebarCollapsed: boolean
  aiSidebarOpen: boolean
  selectedContactId: string | null
  unitsViewMode: UnitsViewMode
  leasingViewMode: LeasingViewMode
  toggleSidebar: () => void
  toggleAISidebar: () => void
  setSelectedContact: (id: string | null) => void
  setUnitsViewMode: (mode: UnitsViewMode) => void
  setLeasingViewMode: (mode: LeasingViewMode) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      aiSidebarOpen: true,
      selectedContactId: null,
      unitsViewMode: 'board',
      leasingViewMode: 'board',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleAISidebar: () => set((s) => ({ aiSidebarOpen: !s.aiSidebarOpen })),
      setSelectedContact: (id) => set({ selectedContactId: id }),
      setUnitsViewMode: (mode) => set({ unitsViewMode: mode }),
      setLeasingViewMode: (mode) => set({ leasingViewMode: mode }),
    }),
    {
      name: 'ui-store',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        aiSidebarOpen: s.aiSidebarOpen,
        unitsViewMode: s.unitsViewMode,
        leasingViewMode: s.leasingViewMode,
      }),
    }
  )
)
