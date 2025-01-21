import { PerspectiveCamera } from "three"
import { create } from "zustand"

import { CAMERA_STATES } from "@/constants/camera-states"

export type CameraStateKeys =
  | "home"
  | "arcade"
  | "stairs"
  | "hoop"
  | "projects"
  | "people"
  | "blog"
  | "menu"

export interface CameraState {
  name: string
  url?: string
  object_name?: string
  position: [number, number, number]
  target: [number, number, number]
  offsetMultiplier?: number
  fov?: number
  targetScrollY?: number
}

const PATHNAME_MAP: Record<string, CameraStateKeys> = {
  "/": "home",
  "/arcade": "arcade",
  "/about": "stairs",
  "/basketball": "hoop",
  "/projects": "projects",
  "/people": "people",
  "/blog": "blog"
}

export type CameraName = "main" | "debug-orbit"

interface CameraStore {
  activeCamera: CameraName
  cameraState: CameraStateKeys
  cameraConfig: CameraState
  camera: PerspectiveCamera | null
  setCameraState: (state: CameraStateKeys) => void
  setCamera: (camera: PerspectiveCamera) => void
  orbitCamera: PerspectiveCamera | null
  updateCameraFromPathname: (pathname: string) => void
  // dithering states
  postProcessingCamera: PerspectiveCamera | null
  disablePostprocessing: boolean
  setDisablePostprocessing: (value: boolean) => void

  cameraStates: any
  setCameraStates: (states: Record<CameraStateKeys, CameraState>) => void
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  // active camera
  activeCamera: "main",
  // main camera
  cameraState: "home",
  cameraConfig: CAMERA_STATES.home,
  cameraStates: CAMERA_STATES, // Initialize with default states
  camera: null,
  setCamera: (camera) => set({ camera }),
  setCameraState: (state) => {
    if (state === get().cameraState) return
    set({
      cameraState: state,
      cameraConfig: get().cameraStates[state] || CAMERA_STATES[state]
    })
  },
  setCameraStates: (states) => {
    set({
      cameraStates: states,
      // Update current config to use new states
      cameraConfig:
        states[get().cameraState] || CAMERA_STATES[get().cameraState]
    })
  },
  updateCameraFromPathname: (pathname) =>
    get().setCameraState(PATHNAME_MAP[pathname] || "home"),

  // debug camera
  orbitCamera: null,

  // dithering states
  postProcessingCamera: null,
  disablePostprocessing: false,
  setDisablePostprocessing: (value) => set({ disablePostprocessing: value })
}))
