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
  cameraConfig: CameraState;
  setCameraState: (state: CameraStateKeys) => void;
  updateCameraFromPathname: (pathname: string) => void;
}

const getStateFromPathname = (pathname: string): CameraStateKeys => {
  switch (pathname) {
    case '/':
      return 'home';
    case '/arcade':
      return 'arcade';
    case '/about':
      return 'stairs';
    case '/basketball':
      return 'hoop';
    default:
      return 'home';
  }
};

export const useCameraStore = create<CameraStore>((set, get) => ({
  cameraState: "home",
  cameraConfig: CAMERA_STATES.home,
  setCameraState: (state) => {
    const { cameraState: currentState } = get();
    if (state === currentState) return;

    set({ 
      cameraState: state,
      cameraConfig: CAMERA_STATES[state],
    });
  },
  updateCameraFromPathname: (pathname) => {
    const newState = getStateFromPathname(pathname);
    get().setCameraState(newState);
  },
}));