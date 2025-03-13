import { create } from "zustand"

interface ContactStore {
  isContactOpen: boolean
  setIsContactOpen: (isContactOpen: boolean) => void
  isAnimating: boolean
  setIsAnimating: (isAnimating: boolean) => void

  worker: Worker | null
  setWorker: (worker: Worker | null) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  setIsContactOpen: (isContactOpen) => {
    set((state) => {
      // If we're animating, don't allow state changes
      if (state.isAnimating) {
        return state
      }
      return { isContactOpen }
    })
  },
  isAnimating: false,
  setIsAnimating: (isAnimating) => {
    set({ isAnimating })
  },

  worker: null,
  setWorker: (worker) => {
    set({ worker })
  }
}))
