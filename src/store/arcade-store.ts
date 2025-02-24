import { create } from "zustand"

interface ArcadeStore {
  hasUnlockedKonami: boolean
  setHasUnlockedKonami: (value: boolean) => void
  isInLabTab: boolean
  setIsInLabTab: (value: boolean) => void
  resetArcadeScreen: () => void
}

export const useArcadeStore = create<ArcadeStore>((set) => ({
  hasUnlockedKonami: false,
  setHasUnlockedKonami: (value) => set({ hasUnlockedKonami: value }),
  isInLabTab: false,
  setIsInLabTab: (value) => set({ isInLabTab: value }),
  resetArcadeScreen: () => set({ hasUnlockedKonami: false, isInLabTab: false })
}))
