import { Vector3 } from "three";
import { create } from "zustand";


export interface CameraConfig {
  position?: Vector3;
  target?: Vector3;
  far?: number;
  near?: number;
  fov?: number;
}

export interface CameraStore {
  cameraConfig: CameraConfig;
  previousConfig: CameraConfig | null;
  setCameraConfig: (cameraConfig: Partial<CameraConfig>) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  cameraConfig: {
    position: new Vector3(0, 3, 8),
    target: new Vector3(0, 0, 0),
    far: 100,
    near: 0.1,
    fov: 20,
  },
  previousConfig: null,
  setCameraConfig: (cameraConfig) => 
    set((state) => ({ 
      previousConfig: state.cameraConfig,
      cameraConfig: { ...state.cameraConfig, ...cameraConfig } 
    })),
}));