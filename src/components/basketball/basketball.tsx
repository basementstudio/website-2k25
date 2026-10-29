import { BallCollider, RigidBody } from "@react-three/rapier"
import { RefObject, useEffect, useRef } from "react"

import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useMinigameStore } from "@/store/minigame-store"

import { BALL_GROUP } from "./collision"
import { getLiveBody } from "./rapier-body"
import { useBallAppearance } from "./use-ball-appearance"

interface BasketballProps {
  ballRef: RefObject<any>
  initialPosition: { x: number; y: number; z: number }
  isDragging: boolean
  hoopPosition: { x: number; y: number; z: number }
  resetBallToInitialPosition: (position?: {
    x: number
    y: number
    z: number
  }) => void
  handlePointerDown: (event: any) => void
  handlePointerMove: (event: any) => void
  handlePointerUp: (event: any) => void
  isTimerEnding?: boolean
  isTimerLow?: boolean
}

export const Basketball = ({
  ballRef,
  initialPosition,
  isDragging,
  resetBallToInitialPosition,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isTimerEnding = false,
  isTimerLow = false
}: BasketballProps) => {
  const { playSoundFX } = useSiteAudio()
  const setCursor = useCursor()
  const { geometry, material, radius, rotation } = useBallAppearance()
  const bounceCount = useRef(0)

  const handleCollision = (other: any) => {
    const randomVolume = 0.05 + Math.random() * 0.05
    const randomPitch = 0.95 + Math.random() * 0.1
    const decreaseVolumeOnBounce = bounceCount.current > 0 ? 0.5 : 0.75

    playSoundFX(
      "BASKETBALL_THUMP",
      randomVolume * decreaseVolumeOnBounce,
      randomPitch
    )
    if (!isDragging) {
      if (other.rigidBodyObject?.name === "floor") {
        bounceCount.current += 1

        if (bounceCount.current >= 1) {
          bounceCount.current = 0
          const ball = getLiveBody(ballRef)
          if (ball && !isTimerLow && !isTimerEnding) {
            const translation = ball.translation()
            const currentPos = {
              x: translation.x,
              y: translation.y,
              z: translation.z
            }
            ball.setBodyType(2)
            resetBallToInitialPosition(currentPos)
          }
        }
      }
    }
  }

  const handleSleep = () => {
    if (!isDragging && !isTimerEnding && !isTimerLow) {
      bounceCount.current = 0
      resetBallToInitialPosition()
    }
  }

  // When the ball RigidBody unmounts (e.g. readyToPlay flips at game end) its
  // rapier handle is freed. Stop any in-flight drag/reset animation so frame
  // callbacks don't keep driving a dead body, which would panic the WASM.
  useEffect(() => {
    return () => {
      const { setIsDragging, setIsResetting } = useMinigameStore.getState()
      setIsDragging(false)
      setIsResetting(false)
    }
  }, [])

  useEffect(() => {
    if (isDragging) {
      setCursor("grabbing")
    } else {
      setCursor("default")
    }

    return () => {
      setCursor("default")
    }
  }, [isDragging, setCursor])

  return (
    <RigidBody
      restitution={0.85}
      colliders={false}
      ref={ballRef}
      type="fixed"
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      onCollisionEnter={({ other }) => handleCollision(other)}
      onSleep={handleSleep}
      friction={0.8}
      linearDamping={0.5}
      angularDamping={0.5}
      // Without CCD a fast shot crosses a 6cm net node in a single step at
      // the clamped 1/15s delta and tunnels straight through the lattice.
      ccd
      collisionGroups={BALL_GROUP}
    >
      {/* Preserve the ball's collider: the decorative stem adds no collision. */}
      <BallCollider args={[radius * 1.25]} />
      <mesh
        scale={1.25}
        geometry={geometry}
        material={material}
        rotation={rotation}
        onPointerDown={isTimerLow ? undefined : handlePointerDown}
        onPointerMove={isTimerLow ? undefined : handlePointerMove}
        onPointerUp={isTimerLow ? undefined : handlePointerUp}
        onPointerEnter={() => !isDragging && !isTimerLow && setCursor("grab")}
        onPointerLeave={() => !isDragging && setCursor("default")}
        userData={{ hasGlobalMaterial: true }}
      />
    </RigidBody>
  )
}
