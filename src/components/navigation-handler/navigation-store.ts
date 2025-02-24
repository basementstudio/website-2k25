import { PerspectiveCamera } from "three"
import { create } from "zustand"

import { IScene } from "./navigation.interface"

export const useNavigationStore = create<{
  scenes: IScene[] | null
  setScenes: (scenes: IScene[]) => void

  currentScene: IScene | null
  setCurrentScene: (scene: IScene) => void

  mainCamera: PerspectiveCamera | null
  setMainCamera: (camera: PerspectiveCamera) => void

  isCanvasTabMode: boolean
  setIsCanvasTabMode: (isCanvasTabMode: boolean) => void

  currentTabIndex: number
  setCurrentTabIndex: (index: number) => void

  disableCameraTransition: boolean
  setDisableCameraTransition: (disable: boolean) => void

  enteredByKeyboard: boolean
  setEnteredByKeyboard: (value: boolean) => void

  resetTabIndex: () => void
}>((set) => ({
  scenes: null,
  setScenes: (scenes) => set({ scenes }),
  currentScene: null,
  setCurrentScene: (scene) => set({ currentScene: scene }),

  mainCamera: null,
  setMainCamera: (camera) => set({ mainCamera: camera }),

  isCanvasTabMode: false,
  setIsCanvasTabMode: (isCanvasTabMode) => set({ isCanvasTabMode }),

  currentTabIndex: -1,
  setCurrentTabIndex: (index) => set({ currentTabIndex: index }),

  disableCameraTransition: false,
  setDisableCameraTransition: (disable) =>
    set({ disableCameraTransition: disable }),

  enteredByKeyboard: false,
  setEnteredByKeyboard: (value) => set({ enteredByKeyboard: value }),

  resetTabIndex: () => set({ currentTabIndex: 0 })
}))
