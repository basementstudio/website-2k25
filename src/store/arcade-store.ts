import { create } from "zustand"

interface ArcadeStore {
  hasUnlockedKonami: boolean
  setHasUnlockedKonami: (value: boolean) => void
  resetArcadeScreen: () => void
}

export const useArcadeStore = create<ArcadeStore>((set) => ({
  hasUnlockedKonami: false,
  setHasUnlockedKonami: (value) => set({ hasUnlockedKonami: value }),
  resetArcadeScreen: () => set({ hasUnlockedKonami: false })
}))
