import { useEffect, useMemo, useState } from "react"
import type { Mesh } from "three"

import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"

interface StreetLane {
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
}

export const OutdoorCars = () => {
  const { cars } = useMesh()
  const [carUpdateCounter, setCarUpdateCounter] = useState(0)

  useEffect(() => {
    if (!cars?.length) return
    for (const lane of STREET_LANES) {
      generateRandomCar(lane, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars])

  const STREET_LANES: StreetLane[] = useMemo(
    () => [
      {
        initialPosition: [50, -0.2, 4],
        targetPosition: [-50, -0.2, 4],
        car: null,
        speed: null,
        startDelay: null,
        nextStartTime: null,
        isMoving: false
      },
      {
        initialPosition: [-50, -0.2, 9],
        targetPosition: [50, -0.2, 9],
        car: null,
        speed: null,
        startDelay: null,
        nextStartTime: null,
        isMoving: false,
        rotation: [0, 0, -Math.PI / 2]
      }
    ],
    []
  )

  const generateRandomCar = (lane: StreetLane, currentTime: number) => {
    if (!cars?.length) return

    const carIndex = Math.min(
      Math.floor(Math.random() * cars.length),
      cars.length - 1
    )
    const selectedCar = cars[carIndex]

    if (selectedCar) {
      lane.car = selectedCar.clone()

      if (lane.car.children && lane.car.children.length >= 2) {
        lane.frontWheels = lane.car.children[0] as Mesh
        lane.backWheels = lane.car.children[1] as Mesh
      }

      if (lane.rotation && lane.car) {
        lane.car.rotation.z = lane.rotation[2]
      }
    }

    lane.speed = Math.floor(Math.random() * 30 + 50)
    lane.startDelay = Number((Math.random() * 5 + 5).toFixed(1)) // 5-10 seconds
    lane.nextStartTime = currentTime + lane.startDelay
    lane.isMoving = false

    if (lane.car) {
      lane.car.position.set(...lane.initialPosition)
    }
  }

  useFrameCallback((_, delta, elapsedTime) => {
    let needsUpdate = false

    STREET_LANES.forEach((lane) => {
      if (!lane.car || !lane.speed || lane.nextStartTime === null) return

      if (!lane.isMoving && elapsedTime >= lane.nextStartTime) {
        lane.isMoving = true
      }

      if (lane.isMoving) {
        const direction =
          lane.targetPosition[0] > lane.initialPosition[0] ? 1 : -1
        lane.car.position.x += lane.speed * 0.277778 * delta * direction

        if (lane.frontWheels && lane.backWheels) {
          const distanceTraveled = lane.speed * 0.277778 * delta // Speed in m/s * delta time
          const wheelRotationSpeed = (distanceTraveled / Math.PI) * Math.PI
          lane.frontWheels.rotation.x += wheelRotationSpeed
          lane.backWheels.rotation.x += wheelRotationSpeed
        }

        if (
          (direction > 0 && lane.car.position.x >= lane.targetPosition[0]) ||
          (direction < 0 && lane.car.position.x <= lane.targetPosition[0])
        ) {
          generateRandomCar(lane, elapsedTime)
          needsUpdate = true
        }
      }
    })

    if (needsUpdate) {
      setCarUpdateCounter((prev) => prev + 1)
    }
  })

  return STREET_LANES.map((lane, index) => {
    if (!lane.car) return null

    return <primitive key={`${index}-${carUpdateCounter}`} object={lane.car} />
  })
}
