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
// It's now a shape key on the merged mesh that also holds the (unrelated!)
// blog door — see BlogDoor, which owns the <primitive> for that mesh. This
// is a DIFFERENT, non-enterable door elsewhere in the office (Nico: "el
// picaporte es de una puerta que no se puede entrar") that just happens to
// share the same merge-by-material mesh/node (SM_00_010) as the blog door
// for export purposes — its hitbox position isn't spatially related to
// BlogDoor's at all. This component only adds the invisible hitbox and
// drives the picaporte's morph influence (a rattle, not an open).
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
        // Position/size measured directly off the "PartID" vertex-color
        // paint on SM_00_010 (Nico's magenta-painted picaporte verts,
        // decoded straight from the Draco-compressed mesh): a tight cluster
        // at local (0.019, y -0.445..0.609, 1.340) — a ~1-unit-tall vertical
        // feature, hence no rotation (cylinderGeometry's default axis is
        // already Y). The old (0.025, 0, 0.09) guess was over a meter off
        // in Z, which is why clicking the visible handle never landed here.
        <mesh
          position={[
            door.position.x + 0.019,
            door.position.y + 0.082,
            door.position.z + 1.34
          ]}
          onPointerEnter={() => {
            if (scene !== "blog") return
            setCursor("pointer")
          }}
          onPointerLeave={() => setCursor("default")}
          onClick={handleClick}
        >
          <cylinderGeometry args={[0.12, 0.12, 1.1, 32]} />
          <MeshDiscardMaterial />
        </mesh>
      )}
    </>
  )
}
