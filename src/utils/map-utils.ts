import { Object3D, Vector3 } from "three"

import { easeInOutCubic } from "./animations"

interface CarState {
  isWaiting: boolean
  waitTimeout: NodeJS.Timeout | null
  isSoundPlaying: boolean
  carCount: number
  currentSpeed: number
  isSlowingDown: boolean
  isSpeedingUp: boolean
  hasInitialized: boolean
}

const CONSTANTS = {
  BASE_SPEED: 0.14,
  START_X: -8.7,
  END_X: 6.7,
  MIN_WAIT_TIME: 6000,
  ADDED_WAIT_TIME: 4000,
  INITIAL_DELAY: 2000,
  SPEED_REDUCTION: 0.7,
  SPEED_VARIATION: 0.5
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
  hasInitialized: false
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

  carPosition.x += carState.currentSpeed

  if (carPosition.x > CONSTANTS.END_X) {
    carPosition.x = CONSTANTS.START_X
    resetCarMovement()
    setRandomTimeout()
  }
}

function runFirstCarPass(carPosition: Vector3) {
  carState.hasInitialized = true
  carPosition.x = CONSTANTS.START_X
  setTimeout(() => {
    carState.isWaiting = false
    resetCarMovement()
  }, CONSTANTS.INITIAL_DELAY)
}

export function animateCar(car: Object3D, t: number, pathname: string) {
  if (pathname !== "/about") {
    car.position.x = CONSTANTS.END_X
    carState.hasInitialized = false
    return
  }

  const carPosition = car.position

  if (!carState.hasInitialized) {
    runFirstCarPass(carPosition)
    return
  }

  if (
    !carState.isWaiting &&
    carPosition.x >= CONSTANTS.START_X &&
    carPosition.x <= CONSTANTS.END_X
  ) {
    const progress = (carPosition.x - CONSTANTS.START_X) / TOTAL_DISTANCE
    updateCarPosition(carPosition, progress)
  } else if (!carState.isWaiting) {
    carPosition.x = CONSTANTS.START_X
    resetCarMovement()
  }
}
