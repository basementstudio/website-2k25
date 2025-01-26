import { create } from "zustand"
import { IScene } from "./navigation.interface"
import { PerspectiveCamera } from "three"

export const useNavigationStore = create<{
  scenes: IScene[] | null
  setScenes: (scenes: IScene[]) => void
  currentScene: IScene | null
  setCurrentScene: (scene: IScene) => void

  mainCamera: PerspectiveCamera | null
  setMainCamera: (camera: PerspectiveCamera) => void
}>((set) => ({
  scenes: null,
  setScenes: (scenes) => set({ scenes }),
  currentScene: null,
  setCurrentScene: (scene) => set({ currentScene: scene }),

  mainCamera: null,
  setMainCamera: (camera) => set({ mainCamera: camera })
}))
