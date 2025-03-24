import { CuboidCollider, CylinderCollider } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"

import { useSiteAudio } from "@/hooks/use-site-audio"
import { useMinigameStore } from "@/store/minigame-store"

export default function RigidBodies({
  hoopPosition
}: {
  hoopPosition: { x: number; y: number; z: number }
}) {
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

  const handleScore = () => {
    const baseScore = 10
    const multipliedScore = Math.floor(baseScore * scoreMultiplier)
    setScore((prev) => prev + multipliedScore)
    incrementConsecutiveScores()
    playSoundFX("BASKETBALL_NET", 0.6, randomPitch)

    if (hasHitStreak) {
      playSoundFX("BASKETBALL_STREAK", 0.06)
    }

    // event for net animation
    window.dispatchEvent(new Event("basketball-score"))
  }

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
        />
      </RigidBody>

      {/* invisible floor */}
      <RigidBody
        type="fixed"
        name="floor"
        position={[hoopPosition.x, -0.08, hoopPosition.z + 3]}
      >
        <CuboidCollider args={[6, 0.1, 6]} onIntersectionEnter={handleMiss} />
      </RigidBody>

      {/* arcade collider */}
      <RigidBody type="fixed" name="arcade" position={[2.943, 1.1, -14.257]}>
        <CuboidCollider args={[0.52, 1, 0.52]} />
      </RigidBody>

      {/* score detection */}
      <RigidBody
        type="fixed"
        position={[
          hoopPosition.x - 0.04,
          hoopPosition.y - 0.35,
          hoopPosition.z + 0.35
        ]}
        sensor
      >
        <CylinderCollider
          onIntersectionEnter={handleScore}
          position={[0, 0.18, 0]}
          args={[0.02, 0.02]}
          scale={[0.2, 8, 4]}
        />

        {/* stairs rigid body */}
        <RigidBody position={[-5.2, -2.7, 14]} type="fixed">
          <CuboidCollider position={[6.2, 0.2, -7.5]} args={[1.5, 0.5, 1]} />
          <CuboidCollider position={[4, 0.2, -9]} args={[0.6, 0.5, 2.2]} />
        </RigidBody>
      </RigidBody>
    </>
  )
}
