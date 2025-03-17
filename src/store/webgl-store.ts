import { create } from "zustand"

interface WebGLStore {
  isWebGLSupported: boolean
}

export const useWebGLStore = create<WebGLStore>((set) => ({
  isWebGLSupported: true,
  setIsWebGLSupported: (isSupported: boolean) =>
    set({ isWebGLSupported: isSupported })
}))
