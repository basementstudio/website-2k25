import { useMesh } from "@/hooks/use-mesh"
import { useFrame } from "@react-three/fiber"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { Mesh, PositionalAudio as ThreePositionalAudio } from "three"

import { useAudioUrls } from "@/lib/audio/audio-urls"
import { PositionalAudio } from "@react-three/drei"
import React from "react"
import {
  CONFIG,
  distanceRange,
  minAudibleDistance,
  minVolume,
  speedRange,
  StreetLane,
  volumeRange
} from "./constants"

export const OutdoorCars = () => {
  const pathname = usePathname()
  const { outdoorCarsMeshes: cars } = useMesh()
  const [carUpdateCounter, setCarUpdateCounter] = useState(0)
  const { OUTDOOR_CARS } = useAudioUrls()
  const currentVolumeRef = useRef(0)
  const distanceToCamera = useRef(0)

  const audioRefs = useRef<
    Map<number, React.RefObject<ThreePositionalAudio | null>>
  >(new Map())

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
        initialPosition: [50, -0.2, 4],
        targetPosition: [-50, -0.2, 4],
        car: null,
        speed: null,
        startDelay: null,
        nextStartTime: null,
        isMoving: false,
        audioId: 0
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

    audioRefs.current.set(
      lane.audioId,
      React.createRef<ThreePositionalAudio | null>()
    )

    if (lane.car) {
      lane.car.position.set(...lane.initialPosition)
    }
  }

  useFrame(({ clock, camera }) => {
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

        // update audio volume based on distance from camera
        const audioRef = audioRefs.current.get(lane.audioId)
        if (audioRef?.current && lane.car) {
          audioRef.current.setRolloffFactor(0.05)

          const distance = camera.position.distanceTo(lane.car.position)
          distanceToCamera.current = distance

          const speedFactor = (lane.speed - CONFIG.speed.min) / speedRange
          const speedBasedVolume = minVolume + speedFactor * volumeRange

          const distanceFactor =
            distance <= minAudibleDistance
              ? 1.0
              : Math.max(0, 1 - (distance - minAudibleDistance) / distanceRange)

          const volume = speedBasedVolume * distanceFactor

          // update audio properties
          audioRef.current.setVolume(volume)
          currentVolumeRef.current = volume
          audioRef.current.position.copy(lane.car.position)
        }

        if (
          (direction > 0 && lane.car.position.x >= lane.targetPosition[0]) ||
          (direction < 0 && lane.car.position.x <= lane.targetPosition[0])
        ) {
          // clean up
          const oldAudioId = lane.audioId
          generateRandomCar(lane, clock.elapsedTime)
          audioRefs.current.delete(oldAudioId)
          needsUpdate = true
        }
      }
    })

    if (needsUpdate && carsVisible) {
      setCarUpdateCounter((prev) => prev + 1)
    }
  })

  return (
    <>
      {STREET_LANES.map((lane, index) => {
        if (!lane.car) return null

        const audioRef = audioRefs.current.get(lane.audioId)

        return (
          <Fragment key={`${index}-${carUpdateCounter}-${lane.audioId}`}>
            <primitive visible={carsVisible} object={lane.car}>
              <PositionalAudio
                ref={audioRef}
                url={OUTDOOR_CARS.CARS_PASSING_BY}
                autoplay
                loop
              />
            </primitive>
          </Fragment>
        )
      })}
    </>
  )
}
