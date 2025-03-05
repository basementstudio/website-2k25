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
import { useSiteAudio } from "@/hooks/use-site-audio"
import { generateRandomCar } from "./utils"

export const OutdoorCars = () => {
  const pathname = usePathname()

  const { outdoorCarsMeshes: cars } = useMesh()
  const [carUpdateCounter, setCarUpdateCounter] = useState(0)
  const { OUTDOOR_CARS } = useAudioUrls()
  const { music } = useSiteAudio()

  const currentVolumeRef = useRef(0)
  const distanceToCamera = useRef(0)
  const directionRef = useRef(0)
  const wheelRotationSpeedRef = useRef(0)
  const speedFactorRef = useRef(0)
  const speedBasedVolumeRef = useRef(0)
  const distanceFactorRef = useRef(0)
  const musicFactorRef = useRef(0)
  const volumeRef = useRef(0)

  const audioRefs = useRef<
    Map<number, React.RefObject<ThreePositionalAudio | null>>
  >(new Map())

  useEffect(() => {
    if (!cars?.length) return
    STREET_LANES.forEach((lane) =>
      generateRandomCar({
        lane,
        cars: cars.filter((car): car is Mesh => car !== null),
        currentTime: 0,
        audioRefs: audioRefs.current
      })
    )
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
        rotate: false,
        audioId: 0
      },
      {
        initialPosition: [-50, -0.2, 9],
        targetPosition: [50, -0.2, 9],
        car: null,
        speed: null,
        startDelay: null,
        nextStartTime: null,
        isMoving: false,
        rotate: true,
        audioId: 0
      }
    ],
    []
  )

  useFrame(({ clock, camera }) => {
    let needsUpdate = false

    STREET_LANES.forEach((lane) => {
      if (!lane.car || !lane.speed || lane.nextStartTime === null) return

      if (!lane.isMoving && clock.elapsedTime >= lane.nextStartTime) {
        lane.isMoving = true
      }

      if (lane.isMoving) {
        directionRef.current =
          lane.targetPosition[0] > lane.initialPosition[0] ? 1 : -1

        lane.car.position.x += lane.speed * 0.005 * directionRef.current

        if (lane.frontWheels && lane.backWheels) {
          wheelRotationSpeedRef.current = lane.speed * 0.01
          lane.frontWheels.rotation.x += wheelRotationSpeedRef.current
          lane.backWheels.rotation.x += wheelRotationSpeedRef.current
        }

        // update audio volume based on distance from camera
        const audioRef = audioRefs.current.get(lane.audioId)
        if (audioRef?.current && lane.car) {
          audioRef.current.setRolloffFactor(0.05)

          distanceToCamera.current = camera.position.distanceTo(
            lane.car.position
          )

          speedFactorRef.current = (lane.speed - CONFIG.speed.min) / speedRange
          speedBasedVolumeRef.current =
            minVolume + speedFactorRef.current * volumeRange

          distanceFactorRef.current =
            distanceToCamera.current <= minAudibleDistance
              ? 1.0
              : Math.max(
                  0,
                  1 -
                    (distanceToCamera.current - minAudibleDistance) /
                      distanceRange
                )

          musicFactorRef.current = music ? 0.8 : 1.0
          volumeRef.current =
            speedBasedVolumeRef.current *
            distanceFactorRef.current *
            musicFactorRef.current

          if (pathname === "/services") {
            audioRef.current.setVolume(volumeRef.current)
          }

          currentVolumeRef.current = volumeRef.current
          audioRef.current.position.copy(lane.car.position)
        }

        if (
          (directionRef.current > 0 &&
            lane.car.position.x >= lane.targetPosition[0]) ||
          (directionRef.current < 0 &&
            lane.car.position.x <= lane.targetPosition[0])
        ) {
          const oldAudioId = lane.audioId
          generateRandomCar({
            lane,
            cars: cars.filter((car): car is Mesh => car !== null),
            currentTime: clock.elapsedTime,
            audioRefs: audioRefs.current
          })
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
