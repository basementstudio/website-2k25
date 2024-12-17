import { useFrame, useThree } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { usePathname } from "next/navigation"
import { useRef, useState } from "react"
import { MathUtils, Vector2, Vector3 } from "three"

import { easeInOutCubic } from "@/utils/animations"

const INITIAL_POSITION = { x: 5.2, y: 1.3, z: -10.7 }
const HOOP_POSITION = { x: 5.23, y: 3.414, z: -14.412 }

const FORWARD_STRENGTH = 0.045
const UP_STRENGTH = 0.15

export const HoopMinigame = () => {
  const isBasketball = usePathname() === "/basketball"
  // @ts-ignore
  const ballRef = useRef<RigidBody>(null)
  const [isDragging, setIsDragging] = useState(false)
  const mousePos = useRef(new Vector2())
  const lastMousePos = useRef(new Vector2())
  const throwVelocity = useRef(new Vector2())
  const dragPos = useRef(new Vector3())
  const dragStartPos = useRef(new Vector3())
  const { camera } = useThree()
  const bounceCount = useRef(0)
  const [isResetting, setIsResetting] = useState(false)
  const resetProgress = useRef(0)
  const startResetPos = useRef(new Vector3())

  useFrame(({ pointer }, delta) => {
    if (isDragging && ballRef.current) {
      throwVelocity.current.x = mousePos.current.x - lastMousePos.current.x
      throwVelocity.current.y = mousePos.current.y - lastMousePos.current.y
      lastMousePos.current.copy(mousePos.current)

      const distance = 4
      dragPos.current.set(pointer.x, pointer.y, 0.5)
      dragPos.current.unproject(camera)
      dragPos.current.sub(camera.position).normalize()
      dragPos.current.multiplyScalar(distance)
      dragPos.current.add(camera.position)

      dragPos.current.x = Math.max(4.2, Math.min(6.2, dragPos.current.x))
      dragPos.current.y = Math.max(1, Math.min(3, dragPos.current.y))
      dragPos.current.z = Math.max(-11.2, Math.min(-10.2, dragPos.current.z))

      ballRef.current.setTranslation(dragPos.current)
    }

    if (isResetting && ballRef.current) {
      resetProgress.current += delta * 3
      const progress = MathUtils.clamp(resetProgress.current, 0, 1)
      const easedProgress = easeInOutCubic(progress)

      const newPosition = new Vector3().lerpVectors(
        startResetPos.current,
        new Vector3(INITIAL_POSITION.x, INITIAL_POSITION.y, INITIAL_POSITION.z),
        easedProgress
      )

      ballRef.current.setTranslation(newPosition)

      if (progress === 1) {
        setIsResetting(false)
        resetProgress.current = 0
        ballRef.current.setBodyType(2)
      }
    }
  })

  const handlePointerDown = (event: any) => {
    event.stopPropagation()
    setIsDragging(true)
    if (ballRef.current) {
      const pos = ballRef.current.translation()
      dragStartPos.current.set(pos.x, pos.y, pos.z)

      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      lastMousePos.current.copy(mousePos.current)
    }
  }

  const handlePointerMove = (event: any) => {
    if (isDragging) {
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
  }

  const handlePointerUp = () => {
    if (isDragging && ballRef.current) {
      ballRef.current.setBodyType("dynamic")

      const currentPos = ballRef.current.translation()

      const dragDelta = new Vector3(
        dragStartPos.current.x - currentPos.x,
        dragStartPos.current.y - currentPos.y,
        dragStartPos.current.z - currentPos.z
      )

      const dragDistance = dragDelta.length()
      const baseThrowStrength = 1.5
      const throwStrength = Math.min(baseThrowStrength * dragDistance, 3)

      const distanceToHoop = Math.abs(HOOP_POSITION.z - currentPos.z)
      const heightDifference = HOOP_POSITION.y - currentPos.y

      ballRef.current.applyImpulse(
        {
          x: -dragDelta.x * throwStrength * 0.015,
          y: heightDifference * UP_STRENGTH * throwStrength,
          z: -distanceToHoop * throwStrength * FORWARD_STRENGTH
        },
        true
      )

      // Backspin
      ballRef.current.applyTorqueImpulse({ x: 0.02, y: 0, z: 0 }, true)

      setIsDragging(false)
    }
  }

  const resetBall = () => {
    if (ballRef.current) {
      const currentPos = ballRef.current.translation()
      startResetPos.current.set(currentPos.x, currentPos.y, currentPos.z)

      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 })
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 })
      setIsResetting(true)
      bounceCount.current = 0
    }
  }

  if (isBasketball) {
    return (
      <>
        <RigidBody
          restitution={0.9}
          colliders="ball"
          ref={ballRef}
          type="fixed"
          position={[
            INITIAL_POSITION.x,
            INITIAL_POSITION.y,
            INITIAL_POSITION.z
          ]}
          onCollisionEnter={({ other }) => {
            if (!isDragging && other.rigidBodyObject?.name === "floor") {
              bounceCount.current += 1
              if (bounceCount.current >= 2) {
                resetBall()
              }
            }
          }}
        >
          <mesh
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </RigidBody>

        {/* invisible wall */}
        <RigidBody>
          <mesh
            position={[HOOP_POSITION.x, HOOP_POSITION.y, HOOP_POSITION.z - 0.1]}
          >
            <planeGeometry args={[5, 5]} />
            <meshBasicMaterial transparent opacity={0.1} color="red" />
          </mesh>
        </RigidBody>

        {/* invisible floor */}
        <RigidBody name="floor">
          <mesh
            rotation-x={-Math.PI / 2}
            position={[HOOP_POSITION.x, 0, HOOP_POSITION.z + 3]}
          >
            <planeGeometry args={[7, 7]} />
            <meshBasicMaterial transparent opacity={0.1} color="blue" />
          </mesh>
        </RigidBody>
      </>
    )
  }
  return null
}
