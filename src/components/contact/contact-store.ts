import { create } from "zustand"

interface ContactStore {
  isContactOpen: boolean
  setIsContactOpen: (isContactOpen: boolean) => void

  worker: Worker | null
  setWorker: (worker: Worker | null) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  setIsContactOpen: (isContactOpen) => {
    set({ isContactOpen })
  },

  worker: null,
  setWorker: (worker) => {
    set({ worker })
  }
}))
