import { MeshDiscardMaterial } from "@react-three/drei"
import { track } from "@vercel/analytics"
import { animate } from "motion"
import posthog from "posthog-js"
import { useMemo, useRef } from "react"
import { Vector3 } from "three"

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
// Hand-measured fallback (a tight vertex cluster found by decoding the
// Draco-compressed mesh once by hand) — used only if picaporteHitboxBounds
// isn't available (older glb, or the paint's missing/mismatched).
const DEFAULT_HITBOX_OFFSET: [number, number, number] = [0.019, 0.082, 1.34]
const DEFAULT_HITBOX_SIZE: [number, number, number] = [0.1, 0.28, 0.28]

export const LockedDoor = () => {
  const { blog } = useMesh()
  const { door, lockedDoorMorphIndex, picaporteHitboxBounds } = blog

  const [hitboxOffset, hitboxSize] = useMemo((): [
    [number, number, number],
    [number, number, number]
  ] => {
    if (!picaporteHitboxBounds) {
      return [DEFAULT_HITBOX_OFFSET, DEFAULT_HITBOX_SIZE]
    }
    const center = new Vector3()
    const size = new Vector3()
    picaporteHitboxBounds.getCenter(center)
    picaporteHitboxBounds.getSize(size)
    // A little padding — the raw painted region is tiny (a doorknob-sized
    // area) and would otherwise be an uncomfortably precise click target.
    size.multiplyScalar(1.4)
    return [center.toArray(), size.toArray()]
  }, [picaporteHitboxBounds])

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
        // Position/size come from picaporteHitboxBounds (the
        // "Picaporte"-colored PartID verts on SM_00_010) when available —
        // see extract-meshes.ts — falling back to the hand-measured
        // default above otherwise.
        <mesh
          position={[
            door.position.x + hitboxOffset[0],
            door.position.y + hitboxOffset[1],
            door.position.z + hitboxOffset[2]
          ]}
          onPointerEnter={() => {
            if (scene !== "blog") return
            setCursor("pointer")
          }}
          onPointerLeave={() => setCursor("default")}
          onClick={handleClick}
        >
          <boxGeometry args={hitboxSize} />
          <MeshDiscardMaterial />
        </mesh>
      )}
    </>
  )
}
