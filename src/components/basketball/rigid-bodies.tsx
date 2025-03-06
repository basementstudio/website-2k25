import { CuboidCollider } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"

import { useSiteAudio } from "@/hooks/use-site-audio"
import { useMinigameStore } from "@/store/minigame-store"

export default function RigidBodies({
  hoopPosition
}: {
  hoopPosition: { x: number; y: number; z: number }
}) {
  const {
    setScore,
    scoreMultiplier,
    incrementConsecutiveScores,
    resetConsecutiveScores,
    setJustScored
  } = useMinigameStore()
  const { playSoundFX } = useSiteAudio()

  const randomPitch = 0.95 + Math.random() * 0.1

  const handleScore = () => {
    const baseScore = 10
    const multipliedScore = Math.floor(baseScore * scoreMultiplier)
    setScore((prev) => prev + multipliedScore)
    incrementConsecutiveScores()
    playSoundFX("BASKETBALL_NET", 0.6, randomPitch)

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

      {/* <mesh
        position={[hoopPosition.x, 0.26, hoopPosition.z + 3]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <sphereGeometry args={[0.27, 8, 8]} />
        <meshBasicMaterial color="red" />
      </mesh> */}

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
        <CuboidCollider
          args={[0.05, 0.05, 0.05]}
          onIntersectionEnter={handleScore}
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
