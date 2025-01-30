import { PerspectiveCamera } from "three"
import { create } from "zustand"

import { IScene } from "./navigation.interface"

interface TabIndices {
  [key: string]: number
}

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

  routeTabIndices: TabIndices
  setRouteTabIndex: (route: string, index: number) => void

  stairVisibility: boolean
  setStairVisibility: (visibility: boolean) => void

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

  routeTabIndices: {},
  setRouteTabIndex: (route, index) =>
    set((state) => ({
      routeTabIndices: { ...state.routeTabIndices, [route]: index }
    })),

  stairVisibility: false,
  setStairVisibility: (visibility) => set({ stairVisibility: visibility }),

  resetTabIndex: () => set({ currentTabIndex: 0 })
}))
