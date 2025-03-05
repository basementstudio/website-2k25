import { AUDIO_FADE_DURATION, CONFIG, StreetLane } from "./constants"
import { PositionalAudio as ThreePositionalAudio, Mesh } from "three"
import { RefObject, createRef } from "react"

export const generateRandomCar = ({
  lane,
  cars,
  currentTime,
  audioRefs
}: {
  lane: StreetLane
  cars: Mesh[]
  currentTime: number
  audioRefs: Map<number, React.RefObject<ThreePositionalAudio | null>>
}) => {
  if (!cars?.length) return

  const carIndex = Math.min(
    Math.floor(Math.random() * cars.length),
    cars.length - 1
  )
  const selectedCar = cars[carIndex]

  if (selectedCar) {
    lane.car = selectedCar.clone()

    if (lane.car?.children && lane.car.children.length >= 2) {
      lane.frontWheels = lane.car.children[0] as Mesh
      lane.backWheels = lane.car.children[1] as Mesh
    }

    if (lane.rotate && lane.car) {
      lane.car.rotation.z = lane.rotate ? -Math.PI / 2 : 0
    }
  }

  lane.speed = Math.floor(
    Math.random() * (CONFIG.speed.max - CONFIG.speed.min) + CONFIG.speed.min
  )

  lane.startDelay = Number(
    (
      Math.random() * (CONFIG.delay.max - CONFIG.delay.min) +
      CONFIG.delay.min
    ).toFixed(1)
  )
  lane.nextStartTime = currentTime + lane.startDelay
  lane.isMoving = false

  lane.audioId = Date.now()

  audioRefs.set(lane.audioId, createRef<ThreePositionalAudio | null>())

  if (lane.car) {
    lane.car.position.set(...lane.initialPosition)
  }
}
