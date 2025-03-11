import { animate } from "motion"
import { useRef } from "react"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/audio/use-site-audio"

export const LockedDoor = () => {
  const { blog } = useMesh()
  const { lockedDoor } = blog

  const scene = useCurrentScene()
  const setCursor = useCursor()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()

  const availableSounds = sfx.blog.lockedDoor.length

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
            onPointerEnter={() => setCursor("pointer")}
            onPointerLeave={() => setCursor("default")}
            onClick={handleClick}
          >
            <cylinderGeometry args={[0.075, 0.075, 0.2, 32]} />
            <meshStandardMaterial opacity={0} transparent depthWrite={false} />
          </mesh>
        </group>
      )}
    </>
  )
}
