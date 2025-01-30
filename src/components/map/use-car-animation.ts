import { useFrame } from "@react-three/fiber"
import { Mesh, Object3D, Vector3 } from "three"

import { easeInOutCubic } from "@/utils/animations"

interface CarState {
  isWaiting: boolean
  waitTimeout: NodeJS.Timeout | null
  isSoundPlaying: boolean
  currentSpeed: number
  isSlowingDown: boolean
  isSpeedingUp: boolean
  hasInitialized: boolean
}

const CONSTANTS = {
  BASE_SPEED: 0.1,
  START_X: -8.7,
  END_X: 7.7,
  MIN_WAIT_TIME: 6000,
  ADDED_WAIT_TIME: 4000,
  SPEED_REDUCTION: 0.7,
  SPEED_VARIATION: 0.5
}

const TOTAL_DISTANCE = CONSTANTS.END_X - CONSTANTS.START_X

const carState: CarState = {
  isWaiting: false,
  waitTimeout: null,
  isSoundPlaying: false,
  currentSpeed: CONSTANTS.BASE_SPEED,
  isSlowingDown: false,
  isSpeedingUp: false,
  hasInitialized: false
}

const setRandomTimeout = () => {
  const waitTime =
    CONSTANTS.MIN_WAIT_TIME + Math.random() * CONSTANTS.ADDED_WAIT_TIME
  carState.isWaiting = true
  carState.isSoundPlaying = false

  if (carState.waitTimeout) clearTimeout(carState.waitTimeout)

  carState.waitTimeout = setTimeout(
    () => (carState.isWaiting = false),
    waitTime
  )
}

const updateCarSpeed = () => {
  carState.currentSpeed = CONSTANTS.BASE_SPEED

  const behavior = Math.random()

  if (behavior < 0.25) {
    carState.isSlowingDown = true
    carState.isSpeedingUp = false
  } else if (behavior < 0.5) {
    carState.isSpeedingUp = true
    carState.isSlowingDown = false
    carState.currentSpeed *= CONSTANTS.SPEED_REDUCTION
  } else {
    carState.isSlowingDown = false
    carState.isSpeedingUp = false
  }
}

const resetCarMovement = () => {
  updateCarSpeed()
}

const updateCarPosition = (carPosition: Vector3, progress: number) => {
  if (carState.isSlowingDown) {
    const slowdownAmount = CONSTANTS.SPEED_VARIATION * easeInOutCubic(progress)
    carState.currentSpeed = CONSTANTS.BASE_SPEED * (1 - slowdownAmount)
  }

  if (carState.isSpeedingUp) {
    const speedupAmount = CONSTANTS.SPEED_VARIATION * easeInOutCubic(progress)
    carState.currentSpeed =
      CONSTANTS.BASE_SPEED * (CONSTANTS.SPEED_REDUCTION + speedupAmount)
  }

  const nextX = carPosition.x + carState.currentSpeed

  carPosition.x = nextX
  carPosition.z = 1.75

  if (carPosition.x > CONSTANTS.END_X) {
    carPosition.x = CONSTANTS.START_X
    resetCarMovement()
    setRandomTimeout()
  }
}

const runFirstCarPass = (carPosition: Vector3) => {
  carState.hasInitialized = true
  carPosition.x = CONSTANTS.START_X
  carState.isWaiting = true
  setRandomTimeout()
}

const animateCar = (car: Object3D) => {
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

export const useCarAnimation = ({ car }: { car: Mesh | null }) => {
  useFrame(() => {
    if (car) animateCar(car)
  })
}
