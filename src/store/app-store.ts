import { CAMERA_STATES } from "@/constants/camera-states";
import { create } from "zustand";
import { PerspectiveCamera } from "three";

export type CameraStateKeys =
  | "home"
  | "arcade"
  | "stairs"
  | "hoop"
  | "showcase"
  | "menu";

export interface CameraState {
  name: string;
  url?: string;
  object_name?: string;
  position: [number, number, number];
  target: [number, number, number];
}

const PATHNAME_MAP: Record<string, CameraStateKeys> = {
  "/": "home",
  "/arcade": "arcade",
  "/about": "stairs",
  "/basketball": "hoop",
  "/showcase": "showcase",
};

export const useCameraStore = create<{
  cameraState: CameraStateKeys;
  cameraConfig: CameraState;
  camera: PerspectiveCamera | null;
  setCameraState: (state: CameraStateKeys) => void;
  setCamera: (camera: PerspectiveCamera) => void;
  updateCameraFromPathname: (pathname: string) => void;
  // dithering states
  postProcessingCamera: PerspectiveCamera | null;
  disablePostprocessing: boolean;
  setDisablePostprocessing: (value: boolean) => void;
}>((set, get) => ({
  cameraState: "home",
  cameraConfig: CAMERA_STATES.home,
  camera: null,
  setCamera: (camera) => set({ camera }),
  setCameraState: (state) => {
    if (state === get().cameraState) return;
    set({ cameraState: state, cameraConfig: CAMERA_STATES[state] });
  },
  updateCameraFromPathname: (pathname) =>
    get().setCameraState(PATHNAME_MAP[pathname] || "home"),

  // dithering states
  postProcessingCamera: null,
  disablePostprocessing: false,
  setDisablePostprocessing: (value) => set({ disablePostprocessing: value }),
}));
