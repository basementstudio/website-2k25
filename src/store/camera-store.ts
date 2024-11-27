import { create } from 'zustand'

export interface CameraState {
  name: string;
  url?: string;
  object_name?: string;
  position: [number, number, number];
  target: [number, number, number];
}

export type CameraStateKeys = 'home' | 'arcade' | 'stairs' | 'hoop' | 'menu';

export const CAMERA_STATES: Record<CameraStateKeys, CameraState> = {
  home: {
    name: "home",
    url: "/home",
    position: [9, 1.6, -8.5],
    target: [7, 1.6, -12],
  },
  arcade: {
    name: "arcade",
    url: "/lab",
    object_name: "arcade",
    position: [2.9, 1.63, -13.21],
    target: [2.9, 1.3, -14],
  },
  stairs: {
    name: "about",
    url: "/about",
    object_name: "stairs",
    position: [6, 1.63, -10.21],
    target: [4, 1, -8],
  },
  hoop: {
    name: "hoop",
    url: "/hoop",
    object_name: "hoop",
    position: [5.5, 1.6, -10],
    target: [5.5, 1.8, -12],
  },
  menu: {
    name: "menu",
    position: [16, 14, -5],
    target: [7, 1.6, -16],
  },
} as const;

interface CameraStore {
    cameraState: CameraStateKeys;
    previousCameraState: CameraStateKeys | null;
    cameraConfig: CameraState;
  setCameraState: (state: CameraStateKeys) => void;
}

export const useCameraStore = create<CameraStore>((set, get) => ({
    cameraState: "home",
    previousCameraState: null,
    cameraConfig: CAMERA_STATES.home,
    setCameraState: (state) => {
      const { cameraState: currentState } = get();
      if (state === currentState) return;

      set({ 
        cameraState: state,
        previousCameraState: currentState,
        cameraConfig: CAMERA_STATES[state as CameraStateKeys],
      });
    },
  }));