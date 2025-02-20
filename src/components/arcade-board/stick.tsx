import { ThreeEvent } from "@react-three/fiber"
import { animate } from "motion"
import { useRef, useState } from "react"
import { Mesh } from "three"

import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useAssets } from "../assets-provider"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useCurrentScene } from "@/hooks/use-current-scene"

export const Stick = ({ stick, offsetX }: { stick: Mesh; offsetX: number }) => {
  const scene = useCurrentScene()
  const { setCursorType } = useMouseStore()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()

  const availableSounds = sfx.arcade.sticks.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))

  const [stickIsGrabbed, setStickIsGrabbed] = useState(false)
  const state = useRef(0)

  const handleGrabStick = () => {
    if (scene !== "lab") return
    setStickIsGrabbed(true)
    setCursorType("grabbing")
  }

  const handleReleaseStick = () => {
    if (scene !== "lab") return
    setStickIsGrabbed(false)
    resetStick()
  }

  const handleStickMove = (e: ThreeEvent<PointerEvent>) => {
    const x = e.point.x - e.eventObject.position.x + offsetX
    const y = e.point.y - e.eventObject.position.y

    const absX = Math.abs(x)
    const absZ = Math.abs(y)

    const maxTilt = 0.15
    const minOffset = 0.02

    let targetRotation
    let currentState

    if (absX < minOffset && absZ < minOffset) {
      targetRotation = {
        x: 0,
        y: 0,
        z: 0
      }
      currentState = 0
    } else if (absX > absZ) {
      targetRotation = {
        x: 0,
        y: 0,
        z: x > 0 ? -maxTilt : maxTilt
      }
      currentState = x > 0 ? 1 : 2
    } else {
      targetRotation = {
        x: y > 0 ? -maxTilt : maxTilt,
        y: 0,
        z: 0
      }
      currentState = y > 0 ? 3 : 4
    }

    if (state.current === currentState) return

    if (state.current !== 0) {
      desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
    }

    animate(stick.rotation, targetRotation, {
      type: "spring",
      stiffness: 2000,
      damping: 64,
      restDelta: 0
    })

    playSoundFX(
      `ARCADE_STICK_${desiredSoundFX.current}_${
        currentState === 0 ? "RELEASE" : "PRESS"
      }`,
      0.2
    )

    state.current = currentState
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

    if (state.current !== 0) {
      playSoundFX(`ARCADE_STICK_${desiredSoundFX.current}_RELEASE`, 0.2)
    }
    state.current = 0
  }

  return (
    <group key={stick.name}>
      <primitive object={stick} />
      <mesh
        position={[
          stick.position.x,
          stick.position.y + 0.07 * Math.sin((69 * Math.PI) / 180),
          stick.position.z + 0.07 * Math.cos((69 * Math.PI) / 180)
        ]}
        rotation={[(16 * Math.PI) / 180, 0, 0]}
        onPointerEnter={() => setCursorType("grab")}
        onPointerLeave={() => {
          if (!stickIsGrabbed) setCursorType("default")
        }}
        onPointerDown={() => handleGrabStick()}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.06, 12]} />
        <meshBasicMaterial opacity={0} transparent />
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
        onPointerLeave={(e) => {
          if (stickIsGrabbed) {
            e.stopPropagation()
            setCursorType("default")
            handleReleaseStick()
          }
        }}
        onPointerUp={(e) => {
          if (stickIsGrabbed) {
            setCursorType(state.current === 0 ? "grab" : "default")
            handleReleaseStick()
          }
        }}
      >
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial opacity={0} transparent />
      </mesh>
    </group>
  )
}
