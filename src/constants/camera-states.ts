import { CameraState, CameraStateKeys } from "@/store/app-store"

export const PROJECTS_CAMERA_SENSITIVITY = 0.025

export const MAX_MOUSE_PAN_OFFSET = 0.03

export const PROJECTS_RIGHT_LIM = -7.3
export const PROJECTS_LEFT_LIM = 1

export const CAMERA_STATES: Record<CameraStateKeys, CameraState> = {
  home: {
    name: "home",
    url: "/home",
    position: [6.6, 1.5, -7.1],
    target: [4.48, 2.0, -12.8],
    fov: 60,
    offsetMultiplier: 2,
    scrollYMin: -1.5
  },
  arcade: {
    name: "arcade",
    url: "/lab",
    object_name: "arcade",
    position: [2.98, 1.6, -12.8],
    target: [2.98, 1.33, -13.8],
    fov: 35,
    offsetMultiplier: 0.1
  },
  stairs: {
    name: "about",
    url: "/about",
    object_name: "stairs",
    position: [6, 1.63, -10.21],
    target: [4, 1, -8],
    fov: 60,
    offsetMultiplier: 1.0
  },
  hoop: {
    name: "hoop",
    url: "/hoop",
    object_name: "hoop",
    position: [5.2, 0.8, -7.7],
    target: [5.2, 1.95, -12],
    fov: 50
  },
  projects: {
    name: "projects",
    url: "/projects",
    object_name: "railing",
    position: [5.9, 4.72, -10.11],
    target: [-4, 5.55, -15.95],
    fov: 60
  },
  careers: {
    name: "careers",
    object_name: "careers",
    url: "/careers",
    position: [6.6, 1.5, -7.1],
    target: [4.48, 2.0, -12.8],
    fov: 60
  },
  blog: {
    name: "blog",
    object_name: "blog",
    url: "/blog",
    position: [6.6, 1.5, -7.1],
    target: [4.48, 2.0, -12.8],
    fov: 60
  },
  menu: {
    name: "menu",
    position: [16, 14, -5],
    target: [7, 1.6, -16],
    fov: 60
  }
}
