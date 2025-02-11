import { Object3D, Vector3 } from "three"

import { CAR_CONFIGS, CarConfig, carState, CONSTANTS } from "./car.interfaces"

// adds random waiting time between car passes
export const setRandomTimeout = () => {
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

// updates car speed and behavior (slow down/speed up chance)
export const updateCarSpeed = () => {
  carState.currentSpeed = CONSTANTS.BASE_SPEED

  const behavior = Math.random()

  if (behavior < 0.9) {
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

// randomly select a car configuration based on probability weights
export const getRandomCarConfig = (): CarConfig => {
  const random = Math.random()
  let cumulativeProbability = 0

  for (const [carName, config] of Object.entries(CAR_CONFIGS)) {
    const previousProbability = cumulativeProbability
    cumulativeProbability += config.probability

    if (random >= previousProbability && random < cumulativeProbability) {
      return config
    }
  }

  console.warn("fallback to default dodge: chances might incorrectly set up")
  return Object.values(CAR_CONFIGS)[0]
}

export const runFirstCarPass = (carPosition: Vector3, carGroup: Object3D) => {
  carState.hasInitialized = true
  carPosition.x = CONSTANTS.START_X
  carState.isWaiting = true
  setRandomTimeout()
  carGroup.visible = false
}
