import { CameraState, CameraStateKeys } from "@/store/app-store"

export const PROJECTS_CAMERA_SENSITIVITY = 0.025

export const MAX_MOUSE_PAN_OFFSET = 0.03

export const PROJECTS_RIGHT_LIM = -7.3
export const PROJECTS_LEFT_LIM = 1

export const CAMERA_STATES: Record<CameraStateKeys, CameraState> = {
  home: {
    name: "home",
    url: "/home",
    position: [6.5, 1.6, -6.5],
    target: [5.5, 1.6, -12],
    rotationAngle: [0.5, 0.5],
    rotationLerp: 0.03
  },
  arcade: {
    name: "arcade",
    url: "/lab",
    object_name: "arcade",
    position: [2.98, 1.3, -13.1],
    target: [2.98, 1.3, -13.8],
    rotationAngle: [0, 0],
    rotationLerp: 0
  },
  stairs: {
    name: "about",
    url: "/about",
    object_name: "stairs",
    position: [6, 1.63, -10.21],
    target: [4, 1, -8],
    rotationAngle: [0.5, 0.5],
    rotationLerp: 0.03
  },
  hoop: {
    name: "hoop",
    url: "/hoop",
    object_name: "hoop",
    position: [5.2, 0.8, -7.7],
    // position: [5.2, 1.6, -9.7],
    target: [5.2, 1.95, -12],
    rotationAngle: [0, 0],
    rotationLerp: 0
  },
  projects: {
    name: "projects",
    url: "/projects",
    object_name: "railing",
    position: [5.9, 4.72, -10.11],
    target: [-4, 5.55, -15.95],
    rotationAngle: [0.5, 0.5],
    rotationLerp: 0.03
  },
  menu: {
    name: "menu",
    position: [16, 14, -5],
    target: [7, 1.6, -16],
    rotationAngle: [1, 1],
    rotationLerp: 0.03
  }
}
