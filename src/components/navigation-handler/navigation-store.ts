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

  isCameraTransitioning: boolean
  setIsCameraTransitioning: (isTransitioning: boolean) => void

  enteredByKeyboard: boolean
  setEnteredByKeyboard: (value: boolean) => void

  resetTabIndex: () => void

  previousScene: IScene | null
  setPreviousScene: (scene: IScene | null) => void
}>((set) => ({
  scenes: null,
  setScenes: (scenes) => set({ scenes }),
  currentScene: null,
  setCurrentScene: (scene) =>
    set((state) => ({
      previousScene: state.currentScene,
      currentScene: scene
    })),

  mainCamera: null,
  setMainCamera: (camera) => set({ mainCamera: camera }),

  isCanvasTabMode: false,
  setIsCanvasTabMode: (isCanvasTabMode) => set({ isCanvasTabMode }),

  currentTabIndex: -1,
  setCurrentTabIndex: (index) => set({ currentTabIndex: index }),

  disableCameraTransition: false,
  setDisableCameraTransition: (disable) =>
    set({ disableCameraTransition: disable }),

  isCameraTransitioning: false,
  setIsCameraTransitioning: (isTransitioning) =>
    set({ isCameraTransitioning: isTransitioning }),

  enteredByKeyboard: false,
  setEnteredByKeyboard: (value) => set({ enteredByKeyboard: value }),

  resetTabIndex: () => set({ currentTabIndex: 0 }),

  previousScene: null,
  setPreviousScene: (scene) => set({ previousScene: scene })
}))
