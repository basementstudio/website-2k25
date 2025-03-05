import { Mesh } from "three"

export interface StreetLane {
  initialPosition: [number, number, number]
  targetPosition: [number, number, number]
  car: Mesh | null
  speed: number | null
  startDelay: number | null
  nextStartTime: number | null
  isMoving: boolean
  rotation?: [number, number, number]
  frontWheels?: Mesh | null
  backWheels?: Mesh | null
  audioId: number
}

export const CONFIG = {
  speed: {
    min: 50,
    max: 60
  },
  delay: {
    min: 2,
    max: 10
  }
}

export const minVolume = 8 // minimum volume in dB
export const maxVolume = 10 // maximum volume in dB
export const maxAudibleDistance = 30 // maximum distance at which car can be heard
export const minAudibleDistance = 5 // distance at which car is at full volume

// Precalculate constants for volume calculations
export const volumeRange = maxVolume - minVolume
export const speedRange = CONFIG.speed.max - CONFIG.speed.min
export const distanceRange = maxAudibleDistance - minAudibleDistance
