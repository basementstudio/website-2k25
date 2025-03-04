import { useMesh } from "@/hooks/use-mesh"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
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
  frontWheels?: Mesh | null
  backWheels?: Mesh | null
}

export const OutdoorCars = () => {
  const { outdoorCarsMeshes: cars } = useMesh()
  const [carUpdateCounter, setCarUpdateCounter] = useState(0)

  useEffect(() => {
    if (!cars?.length) return
    STREET_LANES.forEach((lane) => generateRandomCar(lane, 0))
  }, [cars])

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

      if (lane.car.children && lane.car.children.length >= 2) {
        lane.frontWheels = lane.car.children[0] as Mesh
        lane.backWheels = lane.car.children[1] as Mesh
      }

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

  useFrame(({ clock }) => {
    let needsUpdate = false

    STREET_LANES.forEach((lane) => {
      if (!lane.car || !lane.speed || lane.nextStartTime === null) return

      if (!lane.isMoving && clock.elapsedTime >= lane.nextStartTime) {
        lane.isMoving = true
      }

      if (lane.isMoving) {
        const direction =
          lane.targetPosition[0] > lane.initialPosition[0] ? 1 : -1
        lane.car.position.x += lane.speed * 0.005 * direction

        if (lane.frontWheels && lane.backWheels) {
          const wheelRotationSpeed = lane.speed * 0.01
          lane.frontWheels.rotation.x += wheelRotationSpeed
          lane.backWheels.rotation.x += wheelRotationSpeed
        }

        if (
          (direction > 0 && lane.car.position.x >= lane.targetPosition[0]) ||
          (direction < 0 && lane.car.position.x <= lane.targetPosition[0])
        ) {
          generateRandomCar(lane, clock.elapsedTime)
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
