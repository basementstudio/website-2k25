import { ThreeEvent } from "@react-three/fiber"
import { animate } from "motion"
import { useRef, useState } from "react"
import { Mesh } from "three"

import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useAssets } from "../assets-provider"
import { useSiteAudio } from "@/hooks/use-site-audio"

export const Stick = ({ stick, offsetX }: { stick: Mesh; offsetX: number }) => {
  const [stickIsGrabbed, setStickIsGrabbed] = useState(false)
  const { setCursorType } = useMouseStore()
  const direction = useRef(0)

  const { playSoundFX } = useSiteAudio()
  const {
    sfx: {
      arcade: { sticks: stickSounds }
    }
  } = useAssets()

  const desiredSoundFX = useRef(Math.floor(Math.random() * stickSounds.length))

  const handleGrabStick = () => {
    setCursorType("grab")
    setStickIsGrabbed(true)
  }

  const handleReleaseStick = () => {
    setCursorType("default")
    setStickIsGrabbed(false)
    resetStick()
  }

  const handleStickMove = (e: ThreeEvent<PointerEvent>) => {
    const x = e.point.x - e.eventObject.position.x + offsetX
    const y = e.point.y - e.eventObject.position.y

    const absX = Math.abs(x)
    const absZ = Math.abs(y)

    const maxTilt = 0.15
    const minOffset = 0.025

    let targetRotation
    let currentDirection

    if (absX < minOffset && absZ < minOffset) {
      targetRotation = {
        x: 0,
        y: 0,
        z: 0
      }
      currentDirection = 0
    } else if (absX > absZ) {
      targetRotation = {
        x: 0,
        y: 0,
        z: x > 0 ? -maxTilt : maxTilt
      }
      currentDirection = x > 0 ? 1 : 2
    } else {
      targetRotation = {
        x: y > 0 ? -maxTilt : maxTilt,
        y: 0,
        z: 0
      }
      currentDirection = y > 0 ? 3 : 4
    }

    if (direction.current === currentDirection) return

    if (direction.current !== 0) {
      desiredSoundFX.current = Math.floor(Math.random() * stickSounds.length)
    }

    animate(stick.rotation, targetRotation, {
      type: "spring",
      stiffness: 2000,
      damping: 64,
      restDelta: 0
    })

    playSoundFX(
      `ARCADE_STICK_${desiredSoundFX.current}_${
        currentDirection === 0 ? "RELEASE" : "PRESS"
      }`,
      0.2
    )

    direction.current = currentDirection
  }

  const resetStick = () => {
    animate(
      stick.rotation,
      {
        x: 0,
        y: 0,
        z: 0
      },
      {
        type: "spring",
        stiffness: 2000,
        damping: 64,
        restDelta: 0
      }
    )

    if (direction.current !== 0) {
      playSoundFX(`ARCADE_STICK_${desiredSoundFX.current}_RELEASE`, 0.2)
    }
    direction.current = 0
  }

  return (
    <group key={stick.name}>
      <primitive object={stick} />
      <mesh
        position={[
          stick.position.x,
          stick.position.y + 0.073 * Math.sin((69 * Math.PI) / 180),
          stick.position.z + 0.073 * Math.cos((69 * Math.PI) / 180)
        ]}
        rotation={[(16 * Math.PI) / 180, 0, 0]}
        onPointerEnter={() => setCursorType("grab")}
        onPointerLeave={() => {
          if (!stickIsGrabbed) setCursorType("default")
        }}
        onPointerDown={() => handleGrabStick()}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.065, 24]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh
        position={[
          stick.position.x,
          stick.position.y + 0.07 * Math.sin((69 * Math.PI) / 180),
          stick.position.z + 0.07 * Math.cos((69 * Math.PI) / 180)
        ]}
        onPointerMove={(e) => {
          if (stickIsGrabbed) {
            e.stopPropagation()
            handleStickMove(e)
          }
        }}
        onPointerEnter={(e) => {
          if (stickIsGrabbed) {
            e.stopPropagation()
          }
        }}
        onPointerLeave={(e) => {
          if (stickIsGrabbed) {
            e.stopPropagation()
            handleReleaseStick()
          }
        }}
        onPointerUp={(e) => {
          if (stickIsGrabbed) {
            e.stopPropagation()
            handleReleaseStick()
          }
        }}
      >
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}
