import { useMesh } from "@/hooks/use-mesh"
import { animate, easeOut } from "motion"
import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useRef } from "react"
import { Mesh } from "three"

export const BlogDoor = () => {
  const { blog } = useMesh()
  const { door } = blog
  const { playSoundFX } = useSiteAudio()
  const { setCursorType } = useMouseStore()
  const isOpen = useRef(false)
  const doorHoverRef = useRef<Mesh>(null)

  const handleClick = () => {
    const target = {
      x: door?.userData.originalPosition.x,
      y: door?.userData.originalPosition.y,
      z: door?.userData.originalPosition.z + (isOpen.current ? 0.67 : 0)
    }

    const hoverTarget = {
      x: 0,
      y: 0,
      z: isOpen.current ? 0.67 : 0
    }

    animate(door?.position, target, { ease: easeOut, duration: 1.75 })
    animate(doorHoverRef.current?.position, hoverTarget, {
      ease: easeOut,
      duration: 1.75
    })

    playSoundFX(`BLOG_${isOpen.current ? "OPEN" : "CLOSE"}_DOOR`, 0.4)

    isOpen.current = !isOpen.current
  }

  return (
    door && (
      <group>
        <primitive object={door} />
        <group
          position={[
            door?.userData.originalPosition.x,
            door?.userData.originalPosition.y,
            door?.userData.originalPosition.z + 0.345
          ]}
        >
          <mesh
            position={[0, 0, 0]}
            ref={doorHoverRef}
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
            <boxGeometry args={[0.02, 1.1, 0.65, 32]} />
            <meshStandardMaterial opacity={0} transparent />
          </mesh>
        </group>
      </group>
    )
  )
}
