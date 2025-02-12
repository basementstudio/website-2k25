import type { SetStateAction } from "react"
import { BufferAttribute, Mesh, Object3D, ShaderMaterial, Vector3 } from "three"

export type CarVariant =
  | "DeLorean"
  | "Nissan"
  | "Mistery"
  | "Simpsons"
  | "Kitt"
  | "DeLoreanFly"

export interface CMSTextures {
  dodgeO: string
  dodgeB: string
  delorean: string
  nissan: string
  simpsons: string
  knightRider: string
  mistery: string
}

export interface CarState {
  isWaiting: boolean
  waitTimeout: NodeJS.Timeout | null
  isSoundPlaying: boolean
  currentSpeed: number
  isSlowingDown: boolean
  isSpeedingUp: boolean
  hasInitialized: boolean
  isFlying: boolean
}

export const CONSTANTS = {
  BASE_SPEED: 0.175 / 1.25,
  START_X: -9,
  END_X: 9.5,
  MIN_WAIT_TIME: 8000,
  ADDED_WAIT_TIME: 6000,
  SPEED_REDUCTION: 0.7,
  SPEED_VARIATION: 0.5,
  FLIGHT_PROBABILITY: 0.25
} as const

export const TOTAL_DISTANCE = CONSTANTS.END_X - CONSTANTS.START_X

export interface UpdateCarPositionProps {
  carPosition: Vector3
  progress: number
  setTextureIndex: (value: SetStateAction<number>) => void
  texturesLength: number
  carGroup: Object3D
}

// config for each car shapekey
export interface CarConfig {
  texture: string
  morphTarget: CarVariant | null
  uvSource: "uv2" | "originalUV" | "uv3" | "texcoord_4" | "texcoord_5"
  probability: number
  canFly?: boolean
  wheelSize?: number
  frontWheelOffset?: number
  backWheelOffset?: number
}

export const CAR_CONFIGS: Record<keyof CMSTextures, CarConfig> = {
  dodgeO: {
    texture: "dodgeO",
    morphTarget: null,
    uvSource: "uv2",
    probability: 0.35,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0.2,
    backWheelOffset: 0
  },
  delorean: {
    texture: "delorean",
    morphTarget: "DeLorean",
    uvSource: "uv2",
    probability: 0.05,
    canFly: true,
    wheelSize: 1.1,
    frontWheelOffset: 0.15,
    backWheelOffset: -0.05
  },
  knightRider: {
    texture: "knightRider",
    morphTarget: "Kitt",
    uvSource: "texcoord_5",
    probability: 0.05,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: -0.12,
    backWheelOffset: 0
  },
  nissan: {
    texture: "nissan",
    morphTarget: "Nissan",
    uvSource: "originalUV",
    probability: 0.05,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0,
    backWheelOffset: -0.02
  },
  simpsons: {
    texture: "simpsons",
    morphTarget: "Simpsons",
    uvSource: "texcoord_4",
    probability: 0.05,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0.27,
    backWheelOffset: 0
  },
  dodgeB: {
    texture: "dodgeB",
    morphTarget: null,
    uvSource: "uv2",
    probability: 0.35,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0.25,
    backWheelOffset: 0
  },
  mistery: {
    texture: "mistery",
    morphTarget: "Mistery",
    uvSource: "uv3",
    probability: 0.05,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0,
    backWheelOffset: 0
  }
}

export interface UseCarAnimationProps {
  car: Mesh | null
  frontWheel: Mesh | null
  backWheel: Mesh | null
  textures: CMSTextures
}

export const carState: CarState = {
  isWaiting: false,
  waitTimeout: null,
  isSoundPlaying: false,
  currentSpeed: CONSTANTS.BASE_SPEED,
  isSlowingDown: false,
  isSpeedingUp: false,
  hasInitialized: false,
  isFlying: false
}

export interface updateCarPositionProps {
  carPosition: Vector3
  progress: number
  setTextureIndex: (value: SetStateAction<number>) => void
  texturesLength: number
  carGroup: Object3D
}
