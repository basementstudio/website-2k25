import { PerspectiveCamera } from "three"
import { create } from "zustand"

import { CAMERA_STATES } from "@/constants/camera-states"

export type CameraStateKeys =
  | "home"
  | "lab"
  | "stairs"
  | "hoop"
  | "projects"
  | "careers"
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
  "/lab": "lab",
  "/services": "stairs",
  "/basketball": "hoop",
  "/showcase": "projects",
  "/careers": "careers",
  "/blog": "blog"
}

export type CameraName = "main" | "debug-orbit"

interface CameraStore {
  activeCamera: CameraName
  cameraState: CameraStateKeys
  cameraConfig: CameraState
  camera: PerspectiveCamera | null
  setCamera: (camera: PerspectiveCamera) => void
  // dithering states
  postProcessingCamera: PerspectiveCamera | null
  disablePostprocessing: boolean
  setDisablePostprocessing: (value: boolean) => void
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  // active camera
  activeCamera: "main",
  // main camera
  cameraState: "home",
  cameraConfig: CAMERA_STATES.home,
  camera: null,
  setCamera: (camera) => set({ camera }),

  // debug camera
  orbitCamera: null,

  // dithering states
  postProcessingCamera: null,
  disablePostprocessing: false,
  setDisablePostprocessing: (value) => set({ disablePostprocessing: value })
}))
