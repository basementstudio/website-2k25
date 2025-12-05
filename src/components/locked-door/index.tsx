import { MeshDiscardMaterial } from "@react-three/drei"
import { track } from "@vercel/analytics"
import { animate } from "motion"
import posthog from "posthog-js"
import { useRef } from "react"

import { useAssets } from "@/components/assets-provider/use-assets"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"

export const LockedDoor = () => {
  const { blog } = useMesh()
  const { lockedDoor } = blog

  const scene = useCurrentScene()
  const setCursor = useCursor()
  const { playSoundFX } = useSiteAudio()
  const assets = useAssets()

  const availableSounds = assets?.sfx.blog.lockedDoor.length ?? 0

  const isLockedDoorOpen = useRef(false)

  const handleClick = () => {
    if (scene !== "blog") return
    if (isLockedDoorOpen.current) return

    const r = lockedDoor?.userData.originalRotation

    isLockedDoorOpen.current = true

    let target = { x: r.x + 0.1, y: r.y, z: r.z }

    animate(lockedDoor?.rotation, target)

    const randomSound = Math.floor(Math.random() * availableSounds)
    playSoundFX(`BLOG_LOCKED_DOOR_${randomSound}`, 0.2)
    track("blog_locked_door")
    posthog.capture("blog_locked_door")
    setTimeout(() => {
      animate(lockedDoor?.rotation, r)

      setTimeout(() => {
        isLockedDoorOpen.current = false
      }, 250)
    }, 250)
  }

  return (
    <>
      {lockedDoor && (
        <group>
          <primitive object={lockedDoor} />
          <mesh
            position={[
              lockedDoor?.position.x + 0.025,
              lockedDoor?.position.y,
              lockedDoor?.position.z + 0.09
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
        </group>
      )}
    </>
  )
}
