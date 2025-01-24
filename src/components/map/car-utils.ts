import { Object3D, Vector3 } from "three"

import { easeInOutCubic } from "../../utils/animations"

interface CarState {
  isWaiting: boolean
  waitTimeout: NodeJS.Timeout | null
  isSoundPlaying: boolean
  carCount: number
  currentSpeed: number
  isSlowingDown: boolean
  isSpeedingUp: boolean
  hasInitialized: boolean
  swerveOffset: number
  swerveTime: number
  rotationAngle: number
  baseZOffset: number
}

const CONSTANTS = {
  BASE_SPEED: 0.1,
  START_X: -8.7,
  END_X: 6.7,
  MIN_WAIT_TIME: 6000,
  ADDED_WAIT_TIME: 4000,
  INITIAL_DELAY: 2000,
  SPEED_REDUCTION: 0.7,
  SPEED_VARIATION: 0.5,
  MAX_SWERVE: 0.3,
  SWERVE_SPEED: 0.5,
  MAX_ROTATION: 0.2,
  MAX_Z_OFFSET: 1.5
} as const

const TOTAL_DISTANCE = CONSTANTS.END_X - CONSTANTS.START_X

const carState: CarState = {
  isWaiting: false,
  waitTimeout: null,
  isSoundPlaying: false,
  carCount: 0,
  currentSpeed: CONSTANTS.BASE_SPEED,
  isSlowingDown: false,
  isSpeedingUp: false,
  hasInitialized: false,
  swerveOffset: 0,
  swerveTime: Math.random() * Math.PI * 2,
  rotationAngle: 0,
  baseZOffset: (Math.random() * 2 - 1) * CONSTANTS.MAX_Z_OFFSET
}

function setRandomTimeout() {
  const waitTime =
    CONSTANTS.MIN_WAIT_TIME + Math.random() * CONSTANTS.ADDED_WAIT_TIME
  carState.isWaiting = true
  carState.isSoundPlaying = false

  if (carState.waitTimeout) {
    clearTimeout(carState.waitTimeout)
  }

  carState.waitTimeout = setTimeout(() => {
    carState.isWaiting = false
  }, waitTime)
}

function updateCarSpeed() {
  carState.currentSpeed = CONSTANTS.BASE_SPEED

  if (carState.carCount % 2 === 0 && Math.random() > 0.5) {
    carState.isSlowingDown = true
    carState.isSpeedingUp = false
  } else if (carState.carCount % 2 === 0) {
    carState.isSpeedingUp = true
    carState.isSlowingDown = false
    carState.currentSpeed *= CONSTANTS.SPEED_REDUCTION
  } else {
    carState.isSlowingDown = false
    carState.isSpeedingUp = false
  }
}

function resetCarMovement() {
  carState.carCount++
  updateCarSpeed()
}

function updateCarPosition(carPosition: Vector3, progress: number) {
  if (carState.isSlowingDown) {
    const slowdownAmount = CONSTANTS.SPEED_VARIATION * easeInOutCubic(progress)
    carState.currentSpeed = CONSTANTS.BASE_SPEED * (1 - slowdownAmount)
  }

  if (carState.isSpeedingUp) {
    const speedupAmount = CONSTANTS.SPEED_VARIATION * easeInOutCubic(progress)
    carState.currentSpeed =
      CONSTANTS.BASE_SPEED * (CONSTANTS.SPEED_REDUCTION + speedupAmount)
  }

  carState.swerveTime += CONSTANTS.SWERVE_SPEED * 0.016

  const nextX = carPosition.x + carState.currentSpeed

  const currentSwerve = Math.sin(carState.swerveTime) * CONSTANTS.MAX_SWERVE
  const nextSwerve =
    Math.sin(carState.swerveTime + CONSTANTS.SWERVE_SPEED * 0.016) *
    CONSTANTS.MAX_SWERVE

  const dx = carState.currentSpeed
  const dz = nextSwerve - currentSwerve
  carState.rotationAngle = Math.atan2(dz, dx)

  carPosition.x = nextX
  carPosition.z = currentSwerve + carState.baseZOffset

  if (carPosition.x > CONSTANTS.END_X) {
    carPosition.x = CONSTANTS.START_X
    carState.swerveTime = Math.random() * Math.PI * 2
    carState.baseZOffset = (Math.random() * 2 - 1) * CONSTANTS.MAX_Z_OFFSET
    resetCarMovement()
    setRandomTimeout()
  }
}

function runFirstCarPass(carPosition: Vector3) {
  carState.hasInitialized = true
  carPosition.x = CONSTANTS.START_X
  carState.isWaiting = true
  setRandomTimeout()
}

export function animateCar(car: Object3D, t: number, pathname: string) {
  const carPosition = car.position

  if (pathname !== "/services") {
    if (
      carPosition.x >= CONSTANTS.END_X ||
      carPosition.x <= CONSTANTS.START_X
    ) {
      car.position.x = CONSTANTS.END_X
      car.position.z = 0
      car.rotation.y = 0
      carState.hasInitialized = false
      return
    }
    if (carState.hasInitialized && !carState.isWaiting) {
      const progress = (carPosition.x - CONSTANTS.START_X) / TOTAL_DISTANCE
      updateCarPosition(carPosition, progress)
      car.rotation.y = carState.rotationAngle
    }
    return
  }

  if (!carState.hasInitialized) {
    runFirstCarPass(carPosition)
    carState.baseZOffset = (Math.random() * 2 - 1) * CONSTANTS.MAX_Z_OFFSET
    return
  }

  if (
    !carState.isWaiting &&
    carPosition.x >= CONSTANTS.START_X &&
    carPosition.x <= CONSTANTS.END_X
  ) {
    const progress = (carPosition.x - CONSTANTS.START_X) / TOTAL_DISTANCE
    updateCarPosition(carPosition, progress)
    car.rotation.y = carState.rotationAngle
  } else if (!carState.isWaiting) {
    carPosition.x = CONSTANTS.START_X
    carPosition.z = carState.baseZOffset
    car.rotation.y = 0
    resetCarMovement()
  }
}
