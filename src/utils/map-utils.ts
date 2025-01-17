import { Object3D } from "three"

import { GameAudioSFXKey } from "@/hooks/use-game-audio"

import { easeInOutCubic } from "./animations"

const BASE_SPEED = 0.14
let isWaiting = false
let waitTimeout: NodeJS.Timeout | null = null
let isSoundPlaying = false
let carCount = 0
let currentSpeed = BASE_SPEED
let isSlowingDown = false
let isSpeedingUp = false

const END_X = 6.7
const START_X = -8.7
const TOTAL_DISTANCE = END_X - START_X

function setRandomTimeout() {
  const waitTime = 6000 + Math.random() * 4000
  isWaiting = true
  isSoundPlaying = false

  if (waitTimeout) {
    clearTimeout(waitTimeout)
  }

  waitTimeout = setTimeout(() => {
    isWaiting = false
  }, waitTime)
}

function resetCarMovement() {
  carCount++
  currentSpeed = BASE_SPEED

  if (carCount % 2 === 0) {
    if (Math.random() > 0.5) {
      isSlowingDown = true
      isSpeedingUp = false
      currentSpeed = BASE_SPEED
    } else {
      isSpeedingUp = true
      isSlowingDown = false
      currentSpeed = BASE_SPEED * 0.7
    }
  } else {
    isSlowingDown = false
    isSpeedingUp = false
  }
}

export function animateCar(
  car: Object3D,
  t: number,
  pathname: string,
  playSoundFX: (sfx: GameAudioSFXKey, volume?: number, pitch?: number) => void
) {
  if (pathname !== "/about") {
    car.position.x = END_X
    return
  }

  const carPosition = car.position

  if (!isWaiting && carPosition.x >= START_X && carPosition.x <= END_X) {
    const progress = (carPosition.x - START_X) / TOTAL_DISTANCE
    const easing = easeInOutCubic(progress)

    if (isSlowingDown) {
      const slowdownAmount = 0.5 * easing
      currentSpeed = BASE_SPEED * (1 - slowdownAmount)
    }

    if (isSpeedingUp) {
      const speedupAmount = 0.5 * easing
      currentSpeed = BASE_SPEED * (0.7 + speedupAmount)
    }

    carPosition.x += currentSpeed

    if (carPosition.x > END_X) {
      carPosition.x = START_X
      resetCarMovement()
      setRandomTimeout()
    }
  } else if (!isWaiting) {
    carPosition.x = START_X
    resetCarMovement()
  }
}
