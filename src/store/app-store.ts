import { CAMERA_STATES } from '@/constants/camera-states';
import { create } from 'zustand'

export type CameraStateKeys = 'home' | 'arcade' | 'stairs' | 'hoop' | 'menu';

export interface CameraState {
  name: string;
  url?: string;
  object_name?: string;
  position: [number, number, number];
  target: [number, number, number];
}

const PATHNAME_MAP: Record<string, CameraStateKeys> = {
  '/': 'home',
  '/arcade': 'arcade',
  '/about': 'stairs',
  '/basketball': 'hoop',
};

export const useCameraStore = create<{
  cameraState: CameraStateKeys;
  cameraConfig: CameraState;
  setCameraState: (state: CameraStateKeys) => void;
  updateCameraFromPathname: (pathname: string) => void;
}>((set, get) => ({
  cameraState: "home",
  cameraConfig: CAMERA_STATES.home,
  setCameraState: (state) => {
    if (state === get().cameraState) return;
    set({ cameraState: state, cameraConfig: CAMERA_STATES[state] });
  },
  updateCameraFromPathname: (pathname) => 
    get().setCameraState(PATHNAME_MAP[pathname] || 'home'),
}));