import { MeshDiscardMaterial } from "@react-three/drei"
import { track } from "@vercel/analytics"
import { animate } from "motion"
import posthog from "posthog-js"
import { useRef } from "react"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"

// The picaporte (lock handle) used to be its own rotating mesh (SM_00_012).
// It's now a shape key on the merged door mesh (SM_00_010) — see BlogDoor,
// which owns the <primitive> for that mesh. This component only adds the
// invisible hitbox and drives the picaporte's morph influence.
export const LockedDoor = () => {
  const { blog } = useMesh()
  const { door, lockedDoorMorphIndex } = blog

  const scene = useCurrentScene()
  const setCursor = useCursor()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()

  const availableSounds = sfx.blog.lockedDoor.length

  const isLockedDoorOpen = useRef(false)
  // motion mutates this object in place; onUpdate copies it into the morph
  const rattle = useRef({ v: 0 })

  const handleClick = () => {
    if (scene !== "blog") return
    if (isLockedDoorOpen.current) return
    const influences = door?.morphTargetInfluences
    if (!influences || lockedDoorMorphIndex === null) return

    isLockedDoorOpen.current = true

    animate(
      rattle.current,
      { v: 1 },
      { onUpdate: () => (influences[lockedDoorMorphIndex] = rattle.current.v) }
    )

    const randomSound = Math.floor(Math.random() * availableSounds)
    playSoundFX(`BLOG_LOCKED_DOOR_${randomSound}`, 0.2)
    track("blog_locked_door")
    posthog.capture("blog_locked_door")
    setTimeout(() => {
      animate(
        rattle.current,
        { v: 0 },
        {
          onUpdate: () => (influences[lockedDoorMorphIndex] = rattle.current.v)
        }
      )

      setTimeout(() => {
        isLockedDoorOpen.current = false
      }, 250)
    }, 250)
  }

  return (
    <>
      {door && (
        <mesh
          position={[
            door.position.x + 0.025,
            door.position.y,
            door.position.z + 0.09
          ]}
          rotation={[Math.PI / 2, 0, 0]}
          onPointerEnter={() => {
            if (scene !== "blog") return
            setCursor("pointer")
          }}
          onPointerLeave={() => setCursor("default")}
          onClick={handleClick}
        >
          <cylinderGeometry args={[0.075, 0.075, 0.2, 32]} />
          <MeshDiscardMaterial />
        </mesh>
      )}
    </>
  )
}
