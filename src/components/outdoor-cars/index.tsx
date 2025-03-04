import { useMesh } from "@/hooks/use-mesh"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Fragment, useEffect, useMemo, useState } from "react"
import { Mesh } from "three"

interface StreetLane {
  initialPosition: [number, number, number]
  targetPosition: [number, number, number]
  car: Mesh | null
  speed: number | null
  startDelay: number | null
  nextStartTime: number | null
  isMoving: boolean
  rotation?: [number, number, number]
}

export const OutdoorCars = () => {
  const { outdoorCarsMeshes: cars } = useMesh()
  const [elapsedTime, setElapsedTime] = useState(0)

  const STREET_LANES: StreetLane[] = useMemo(
    () => [
      {
        initialPosition: [10, -0.2, 4],
        targetPosition: [-15, -0.2, 4],
        car: null,
        speed: null,
        startDelay: null,
        nextStartTime: null,
        isMoving: false
      },
      {
        initialPosition: [-13, -0.2, 9],
        targetPosition: [10, -0.2, 9],
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
      if (lane.rotation && lane.car) {
        lane.car.rotation.z = lane.rotation[2]
      }
    }

    lane.speed = Math.floor(Math.random() * 30 + 10) // 10-40 km/h
    lane.startDelay = Number((Math.random() * 10 + 10).toFixed(1)) // 10-20 seconds
    lane.nextStartTime = currentTime + lane.startDelay
    lane.isMoving = false

    if (lane.car) {
      lane.car.position.set(...lane.initialPosition)
    }
  }

  useEffect(() => {
    if (!cars?.length) return
    STREET_LANES.forEach((lane) => generateRandomCar(lane, 0))
  }, [cars])

  useFrame((state) => {
    const currentTime = state.clock.getElapsedTime()
    setElapsedTime(currentTime)

    STREET_LANES.forEach((lane) => {
      if (!lane.car || !lane.speed || lane.nextStartTime === null) return

      if (!lane.isMoving && currentTime >= lane.nextStartTime) {
        lane.isMoving = true
      }

      if (lane.isMoving) {
        const direction =
          lane.targetPosition[0] > lane.initialPosition[0] ? 1 : -1
        lane.car.position.x += lane.speed * 0.005 * direction

        if (
          (direction > 0 && lane.car.position.x >= lane.targetPosition[0]) ||
          (direction < 0 && lane.car.position.x <= lane.targetPosition[0])
        ) {
          generateRandomCar(lane, currentTime)
        }
      }
    })
  })

  return STREET_LANES.map((lane, index) => {
    if (!lane.car) return null

    return (
      <primitive
        key={index}
        object={lane.car}
        position={lane.initialPosition}
      />
    )
  })
}
