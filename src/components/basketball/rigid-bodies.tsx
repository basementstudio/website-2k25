import { CuboidCollider } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"
import { track } from "@vercel/analytics"
import { useEffect } from "react"

import { useSiteAudio } from "@/hooks/use-site-audio"
import { useMinigameStore } from "@/store/minigame-store"

import { STATIC_GROUP } from "./collision"
import { netGoalHandler, netTouchHandler } from "./net-physics"

interface RigidBodiesProps {
  hoopPosition: { x: number; y: number; z: number }
}

export const RigidBodies = ({ hoopPosition }: RigidBodiesProps) => {
  const setScore = useMinigameStore((s) => s.setScore)
  const scoreMultiplier = useMinigameStore((s) => s.scoreMultiplier)
  const incrementConsecutiveScores = useMinigameStore(
    (s) => s.incrementConsecutiveScores
  )
  const resetConsecutiveScores = useMinigameStore(
    (s) => s.resetConsecutiveScores
  )
  const setJustScored = useMinigameStore((s) => s.setJustScored)

  const consecutiveScores = useMinigameStore((s) => s.consecutiveScores)
  const hasHitStreak = consecutiveScores === 2

  const { playSoundFX } = useSiteAudio()

  const randomPitch = 0.95 + Math.random() * 0.1

  // Swish audio plays at first net contact (rim-plane crossing), while the
  // score waits for the confirmed pass below the net (see netGoalHandler /
  // netTouchHandler) — that tracking replaced the old sensor collider,
  // whose enter/exit events raced the through-rim flag.
  const handleNetTouch = () => {
    playSoundFX("BASKETBALL_NET", 0.6, randomPitch)
  }

  const handleScore = () => {
    const baseScore = 10
    const multipliedScore = Math.floor(baseScore * scoreMultiplier)
    setScore((prev) => prev + multipliedScore)
    incrementConsecutiveScores()
    track("basketball_score")

    if (hasHitStreak) playSoundFX("BASKETBALL_STREAK", 0.06)
  }

  useEffect(() => {
    netGoalHandler.current = handleScore
    netTouchHandler.current = handleNetTouch
    return () => {
      netGoalHandler.current = null
      netTouchHandler.current = null
    }
  })

  const handleMiss = () => {
    setJustScored(false)
    resetConsecutiveScores()
  }

  return (
    <>
      {/* invisible wall */}
      <RigidBody
        type="fixed"
        name="wall"
        position={[hoopPosition.x, hoopPosition.y, hoopPosition.z - 0.1]}
      >
        <CuboidCollider
          args={[2.5, 3.5, 0.1]}
          onIntersectionEnter={handleMiss}
          collisionGroups={STATIC_GROUP}
        />
      </RigidBody>

      {/* invisible floor */}
      <RigidBody
        type="fixed"
        name="floor"
        position={[hoopPosition.x, -0.08, hoopPosition.z + 3]}
      >
        <CuboidCollider
          args={[6, 0.1, 6]}
          onIntersectionEnter={handleMiss}
          collisionGroups={STATIC_GROUP}
        />
      </RigidBody>

      {/* arcade collider */}
      <RigidBody type="fixed" name="arcade" position={[2.943, 1.1, -14.257]}>
        <CuboidCollider args={[0.52, 1, 0.52]} collisionGroups={STATIC_GROUP} />
      </RigidBody>

      <RigidBody
        type="fixed"
        position={[
          hoopPosition.x - 0.04,
          hoopPosition.y - 0.35,
          hoopPosition.z + 0.35
        ]}
      >
        {/* stairs rigid body */}
        <RigidBody position={[-5.2, -2.7, 14]} type="fixed">
          <CuboidCollider
            position={[6.2, 0.2, -7.5]}
            args={[1.5, 0.5, 1]}
            collisionGroups={STATIC_GROUP}
          />
          <CuboidCollider
            position={[4, 0.2, -9]}
            args={[0.6, 0.5, 2.2]}
            collisionGroups={STATIC_GROUP}
          />
        </RigidBody>
      </RigidBody>
    </>
  )
}
