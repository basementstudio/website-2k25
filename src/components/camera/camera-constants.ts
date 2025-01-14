import { CAMERA_STATES } from "@/constants/camera-states"

const config = CAMERA_STATES["stairs"]

export const INITIAL_CONFIG = {
  position: config.position,
  target: config.target
}
