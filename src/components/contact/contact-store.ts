import { create } from "zustand"

interface ContactStore {
  isContactOpen: boolean
  setIsContactOpen: (isContactOpen: boolean) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  setIsContactOpen: (isContactOpen) => set({ isContactOpen })
}))
