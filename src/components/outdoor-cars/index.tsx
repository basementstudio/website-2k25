import { useMesh } from "@/hooks/use-mesh"
import { useFrame } from "@react-three/fiber"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"
import * as THREE from "three"
import { PositionalAudio } from "@react-three/drei"
import { useSiteAudio } from "@/hooks/use-site-audio"

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
  const pathname = usePathname()
  const { outdoorCarsMeshes: cars } = useMesh()
  const [carUpdateCounter, setCarUpdateCounter] = useState(0)

  useEffect(() => {
    if (!cars?.length) return
    STREET_LANES.forEach((lane) => generateRandomCar(lane, 0))
  }, [cars])

  const carsVisible = useMemo(() => {
    return pathname === "/services" || pathname === "/people"
  }, [pathname])

  const STREET_LANES: StreetLane[] = useMemo(
    () => [
      {
        initialPosition: [40, -0.2, 4],
        targetPosition: [-40, -0.2, 4],
        car: null,
        speed: null,
        startDelay: null,
        nextStartTime: null,
        isMoving: false
      },
      {
        initialPosition: [-40, -0.2, 9],
        targetPosition: [40, -0.2, 9],
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

    if (needsUpdate && carsVisible) {
      setCarUpdateCounter((prev) => prev + 1)
    }
  })

  const audioRef = useRef<THREE.PositionalAudio>(null)
  const { music } = useSiteAudio()
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.setDistanceModel("exponential")
      audioRef.current.setRolloffFactor(2)
      audioRef.current.setRefDistance(1)
      audioRef.current.setMaxDistance(10)
      audioRef.current.setVolume(music ? 5 : 0)
    }
  }, [music])

  return (
    <>
      {STREET_LANES.map((lane, index) => {
        if (!lane.car) return null

        return (
          <Fragment key={`${index}-${carUpdateCounter}`}>
            <primitive visible={carsVisible} object={lane.car}>
              {index === 0 && (
                <PositionalAudio
                  ref={audioRef}
                  url="/car.mp3"
                  distance={5}
                  autoplay
                  loop
                />
              )}
            </primitive>
          </Fragment>
        )
      })}
    </>
  )
}
