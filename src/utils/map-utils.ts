import { Object3D } from "three"

// car speed 0.035 - 0.065
const CAR_SPEED = Math.random() * 0.03 + 0.035
let isWaiting = false
let waitTimeout: NodeJS.Timeout | null = null

function setRandomTimeout() {
  const waitTime = Math.random() * 5000 + 4000
  isWaiting = true

  if (waitTimeout) {
    clearTimeout(waitTimeout)
  }

  waitTimeout = setTimeout(() => {
    isWaiting = false
  }, waitTime)
}

export function animateCar(car: Object3D, t: number) {
  const carPosition = car.position

  if (!isWaiting && carPosition.x >= -6.7 && carPosition.x <= 6.7) {
    carPosition.x += CAR_SPEED

    if (carPosition.x > 6.7) {
      carPosition.x = -6.7
      setRandomTimeout()
    }
  } else if (!isWaiting) {
    carPosition.x = -6.7
  }
}
