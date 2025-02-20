import { ThreeEvent } from "@react-three/fiber"
import { animate } from "motion"
import { useRef, useState } from "react"
import { Mesh } from "three"

import { useMouseStore } from "../mouse-tracker/mouse-tracker"

export const Stick = ({ stick, offsetX }: { stick: Mesh; offsetX: number }) => {
  const [stickIsGrabbed, setStickIsGrabbed] = useState(false)
  const { setCursorType } = useMouseStore()
  const direction = useRef(0)

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

    if (direction.current !== currentDirection) {
      animate(stick.rotation, targetRotation, {
        type: "spring",
        stiffness: 2000,
        damping: 64,
        restDelta: 0
      })
      direction.current = currentDirection
    }
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
