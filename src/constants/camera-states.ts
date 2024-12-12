import { CameraState, CameraStateKeys } from "@/store/app-store";

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
    position: [2.98, 1.65, -13.42],
    target: [2.98, 1.35, -14],
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
};
