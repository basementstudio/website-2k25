import { PerspectiveCamera } from "three"
import { INITIAL_CONFIG } from "./camera-constants"

export const calculatePlanePosition = () => {
  const [px, py, pz] = INITIAL_CONFIG.position
  const [tx, ty, tz] = INITIAL_CONFIG.target
  const direction = {
    x: tx - px,
    y: ty - py,
    z: tz - pz
  }
  const scale =
    1 / Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2)
  return [
    px + direction.x * scale,
    py + direction.y * scale,
    pz + direction.z * scale
  ] as [number, number, number]
}

export const calculateMovementVectors = (
  basePosition: [number, number, number]
) => {
  const cameraPos = INITIAL_CONFIG.position

  // Direction from camera to plane
  const directionVector = {
    x: basePosition[0] - cameraPos[0],
    z: basePosition[2] - cameraPos[2]
  }

  // Normalize
  const length = Math.sqrt(directionVector.x ** 2 + directionVector.z ** 2)

  // Right vector (perpendicular to direction)
  return {
    x: -directionVector.z / length,
    z: directionVector.x / length
  }
}

type Position = { x: number; z: number }

export const calculateNewPosition = (
  currentPos: Position,
  targetPos: Position,
  smoothFactor = 1
): Position => ({
  x: currentPos.x + (targetPos.x - currentPos.x) * smoothFactor,
  z: currentPos.z + (targetPos.z - currentPos.z) * smoothFactor
})

export const calculateViewDimensions = (
  camera: PerspectiveCamera,
  distance: number
) => {
  const fovRadians = (camera.fov * Math.PI) / 180
  const height = 2 * Math.tan(fovRadians / 2) * distance
  const width = height * camera.aspect
  return { width, height }
}
