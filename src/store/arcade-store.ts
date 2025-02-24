import { LabTab } from "@/components/arcade-screen/screen-ui"
import { create } from "zustand"

interface ArcadeStore {
  hasUnlockedKonami: boolean
  setHasUnlockedKonami: (value: boolean) => void
  resetArcadeScreen: () => void

  isInLabTab: boolean
  setIsInLabTab: (value: boolean) => void

  labTabIndex: number
  setLabTabIndex: (value: number) => void

  labTabs: LabTab[]
  setLabTabs: (tabs: LabTab[]) => void

  currentLabTabIndex: number
  setCurrentLabTabIndex: (index: number) => void

  isSourceButtonSelected: boolean
  setIsSourceButtonSelected: (value: boolean) => void
}

export const useArcadeStore = create<ArcadeStore>((set) => ({
  hasUnlockedKonami: false,
  setHasUnlockedKonami: (value) => set({ hasUnlockedKonami: value }),
  resetArcadeScreen: () => set({ hasUnlockedKonami: false, isInLabTab: false }),

  isInLabTab: false,
  setIsInLabTab: (value) => set({ isInLabTab: value }),

  labTabIndex: -1,
  setLabTabIndex: (value) => set({ labTabIndex: value }),

  labTabs: [],
  setLabTabs: (tabs) => set({ labTabs: tabs }),

  currentLabTabIndex: -1,
  setCurrentLabTabIndex: (index) => set({ currentLabTabIndex: index }),

  isSourceButtonSelected: false,
  setIsSourceButtonSelected: (value) => set({ isSourceButtonSelected: value })
}))
