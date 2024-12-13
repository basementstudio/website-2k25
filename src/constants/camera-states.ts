import { CameraState, CameraStateKeys } from "@/store/app-store";

export const PROJECTS_CAMERA_SENSITIVITY = 0.025;

export const MAX_MOUSE_PAN_OFFSET = 0.03;

export const CAMERA_STATES: Record<CameraStateKeys, CameraState> = {
  home: {
    name: "home",
    url: "/home",
    position: [9, 1.6, -8.5],
    target: [7, 1.6, -12],
    rotationAngle: [0.5, 0.5],
    rotationLerp: 0.03,
  },
  arcade: {
    name: "arcade",
    url: "/lab",
    object_name: "arcade",
    position: [2.98, 1.65, -13.42],
    target: [2.98, 1.35, -14],
    rotationAngle: [0, 0],
    rotationLerp: 0,
  },
  stairs: {
    name: "about",
    url: "/about",
    object_name: "stairs",
    position: [6, 1.63, -10.21],
    target: [4, 1, -8],
    rotationAngle: [0.5, 0.5],
    rotationLerp: 0.03,
  },
  hoop: {
    name: "hoop",
    url: "/hoop",
    object_name: "hoop",
    position: [5.5, 1.6, -10],
    target: [5.5, 1.8, -12],
    rotationAngle: [0, 0],
    rotationLerp: 0,
  },
  projects: {
    name: "projects",
    url: "/projects",
    object_name: "railing",
    position: [6, 4.78, -10.21],
    target: [-4, 5.5, -12],
    rotationAngle: [0.5, 0.5],
    rotationLerp: 0.03,
  },
  menu: {
    name: "menu",
    position: [16, 14, -5],
    target: [7, 1.6, -16],
    rotationAngle: [1, 1],
    rotationLerp: 0.03,
  },
};
