import type { PerspectiveCamera } from "three"

import type { ICameraConfig } from "../navigation-handler/navigation.interface"

export const easeInOutCubic = (x: number): number => {
  if (x < 0.5) {
    // Replace power with direct multiplications (x³ = x * x * x)
    return 4 * x * x * x
  }
  // Calculate (2*x-2) once and use multiplication instead of power
  const t = -2 * x + 2
  return 1 - (t * t * t) / 2
}

export const calculatePlanePosition = (cameraConfig: ICameraConfig) => {
  const [px, py, pz] = cameraConfig.position
  const [tx, ty, tz] = cameraConfig.target

  // Calculate differences once
  const dx = tx - px
  const dy = ty - py
  const dz = tz - pz

  // Use inverse square root (more efficient)
  const invDist = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz)

  return [px + dx * invDist, py + dy * invDist, pz + dz * invDist] as [
    number,
    number,
    number
  ]
}

export const calculateMovementVectors = (
  basePosition: [number, number, number],
  cameraConfig: ICameraConfig
) => {
  const cameraPos = cameraConfig.position

  // Calculate once
  const dx = basePosition[0] - cameraPos[0]
  const dz = basePosition[2] - cameraPos[2]

  // Calculate inverse length (avoids repeated division)
  const invLength = 1 / Math.sqrt(dx * dx + dz * dz)

  // Right vector (perpendicular to direction)
  return {
    x: -dz * invLength,
    z: dx * invLength
  }
}

type Position = { x: number; z: number }

export const calculateNewPosition = (
  currentPos: Position,
  targetPos: Position,
  smoothFactor = 1
): Position => {
  // Skip calculations if smoothFactor is 1
  if (smoothFactor === 1) return { ...targetPos }

  return {
    x: currentPos.x + (targetPos.x - currentPos.x) * smoothFactor,
    z: currentPos.z + (targetPos.z - currentPos.z) * smoothFactor
  }
}

export const calculateViewDimensions = (
  camera: PerspectiveCamera,
  distance: number,
  cameraConfig: ICameraConfig
) => {
  // Pre-calculate constants
  const fovRad = ((cameraConfig.fov ?? 55) * Math.PI) / 180
  const tanHalfFov = Math.tan(fovRad / 2)

  // Reduce operations
  const height = 2 * tanHalfFov * distance
  const width = height * camera.aspect
  return { width, height }
}
