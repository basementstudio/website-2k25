import { create } from "zustand"
import { IScene } from "./navigation.interface"

export const useNavigationStore = create<{
  scenes: IScene[] | null
  setScenes: (scenes: IScene[]) => void
}>((set) => ({
  scenes: null,
  setScenes: (scenes) => set({ scenes })
}))
