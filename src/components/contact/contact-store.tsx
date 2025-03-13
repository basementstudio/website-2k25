import { create } from "zustand"

const useContactStore = create((set) => ({
  isAnimating: false,
  setAnimating: (isAnimating) => set({ isAnimating })
}))

export default useContactStore
