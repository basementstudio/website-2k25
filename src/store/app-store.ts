import { CAMERA_STATES } from '@/constants/camera-states';
import { create } from 'zustand'

export interface CameraState {
  name: string;
  url?: string;
  object_name?: string;
  position: [number, number, number];
  target: [number, number, number];
}

export type CameraStateKeys = 'home' | 'arcade' | 'stairs' | 'hoop' | 'menu';

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