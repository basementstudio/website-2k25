import { animate, easeOut } from "motion"
import { useRef } from "react"
import { Mesh } from "three"

import { useAssets } from "@/components/assets-provider"
import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { useSiteAudio } from "@/hooks/use-site-audio"

import { DOOR_ANIMATION_CLOSE, DOOR_ANIMATION_OPEN } from "./constants"

export const BlogDoor = () => {
  const { blog } = useMesh()
  const { door } = blog

  const scene = useCurrentScene()
  const { setCursorType } = useMouseStore()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()

  const availableSounds = sfx.blog.door.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))

  const isOpen = useRef(false)
  const doorHoverRef = useRef<Mesh>(null)

  const handleClick = () => {
    if (scene !== "blog") return

    const target = {
      x: door?.userData.originalRotation.x,
      y: door?.userData.originalRotation.y,
      z:
        door?.userData.originalRotation.z + (!isOpen.current ? -Math.PI / 2 : 0)
    }

    const hoverTarget = {
      x: 0,
      y: !isOpen.current ? Math.PI / 2 : 0,
      z: 0
    }

    const config = !isOpen.current ? DOOR_ANIMATION_OPEN : DOOR_ANIMATION_CLOSE

    animate(door?.rotation, target, config)
    animate(doorHoverRef.current?.rotation, hoverTarget, config)

    playSoundFX(
      `BLOG_DOOR_${desiredSoundFX.current}_${!isOpen.current ? "OPEN" : "CLOSE"}`,
      0.4
    )

    if (isOpen.current) {
      desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
    }

    isOpen.current = !isOpen.current
  }

  return (
    door && (
      <group>
        <primitive object={door} />
        <group
          ref={doorHoverRef}
          position={door.position}
          onPointerEnter={(e) => {
            e.stopPropagation()
            setCursorType("click")
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            setCursorType("default")
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (doorHoverRef.current) {
              handleClick()
              setCursorType("default")
            }
          }}
        >
          <mesh position={[0, 0, 0.345]}>
            <boxGeometry args={[0.02, 1.1, 0.65, 32]} />
            <meshBasicMaterial opacity={0} transparent />
          </mesh>
        </group>
      </group>
    )
  )
}
