import { create } from "zustand"
import { IScene } from "./navigation.interface"
import { PerspectiveCamera } from "three"
import { CAMERA_STATES } from "@/constants/camera-states"

export const useNavigationStore = create<{
  scenes: IScene[] | null
  setScenes: (scenes: IScene[]) => void

  currentScene: IScene | null
  setCurrentScene: (scene: IScene) => void

  camera: PerspectiveCamera | null
  setCamera: (camera: PerspectiveCamera) => void
  orbitCamera: PerspectiveCamera | null

  //remove this
  postProcessingCamera: PerspectiveCamera | null
  disablePostprocessing: boolean
  setDisablePostprocessing: (value: boolean) => void
}>((set) => ({
  scenes: null,
  setScenes: (scenes) => set({ scenes }),

  currentScene: null,
  setCurrentScene: (scene) => set({ currentScene: scene }),

  //TODO: remove this
  activeCamera: "main",
  cameraState: "home",
  cameraConfig: CAMERA_STATES.home,
  camera: null,
  setCamera: (camera) => set({ camera }),
  orbitCamera: null,
  postProcessingCamera: null,
  disablePostprocessing: false,
  setDisablePostprocessing: (value) => set({ disablePostprocessing: value })
}))
