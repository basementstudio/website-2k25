import { MeshDiscardMaterial } from "@react-three/drei"
import { track } from "@vercel/analytics"
import { animate } from "motion"
import posthog from "posthog-js"
import { useRef } from "react"
import { Mesh } from "three"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"

import { DOOR_ANIMATION_CLOSE, DOOR_ANIMATION_OPEN } from "./constants"

export const BlogDoor = () => {
  const { blog } = useMesh()
  const { door, doorMorphIndex } = blog

  const scene = useCurrentScene()
  const setCursor = useCursor()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()

  const availableSounds = sfx.blog.door.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))

  const isOpen = useRef(false)
  const doorHoverRef = useRef<Mesh>(null)
  // motion mutates this object in place; onUpdate copies it into the morph
  const swing = useRef({ v: 0 })

  const handleClick = () => {
    if (scene !== "blog") return
    const influences = door?.morphTargetInfluences
    if (!influences || doorMorphIndex === null) return

    const config = !isOpen.current ? DOOR_ANIMATION_OPEN : DOOR_ANIMATION_CLOSE

    animate(
      swing.current,
      { v: !isOpen.current ? 1 : 0 },
      {
        ...config,
        onUpdate: () => {
          influences[doorMorphIndex] = swing.current.v
        }
      }
    )

    if (!isOpen.current) {
      track("blog_door_open")
      posthog.capture("blog_door_open")
      playSoundFX(`BLOG_DOOR_${desiredSoundFX.current}_OPEN`, 0.4)
    } else {
      track("blog_door_close")
      posthog.capture("blog_door_close")
      setTimeout(
        () => playSoundFX(`BLOG_DOOR_${desiredSoundFX.current}_CLOSE`, 0.25),
        250
      )
    }

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
            if (scene !== "blog") return
            e.stopPropagation()
            setCursor("pointer")
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            setCursor("default")
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (doorHoverRef.current) {
              handleClick()
              setCursor("default")
            }
          }}
        >
          <mesh position={[0, 0, 0.345]}>
            <boxGeometry args={[0.02, 1.1, 0.65, 32]} />
            <MeshDiscardMaterial />
          </mesh>
        </group>
      </group>
    )
  )
}
