import { useMesh } from "@/hooks/use-mesh"
import { animate } from "motion"
import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useRef } from "react"

export const LockedDoor = () => {
  const { blog } = useMesh()
  const { lockedDoor } = blog
  const { playSoundFX } = useSiteAudio()
  const { setCursorType } = useMouseStore()
  const isLockedDoorOpen = useRef(false)

  const handleClick = () => {
    if (isLockedDoorOpen.current) return

    const r = lockedDoor?.userData.originalRotation

    isLockedDoorOpen.current = true

    let targetPosition = {
      x: r.x + 0.1,
      y: r.y,
      z: r.z
    }

    animate(lockedDoor?.rotation, targetPosition)

    const randomIndex = Math.random() > 0.5 ? "A" : "B"
    playSoundFX(`BLOG_LOCKED_DOOR_${randomIndex}`, 0.2)

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
            onPointerEnter={() => setCursorType("click")}
            onPointerLeave={() => setCursorType("default")}
            onClick={handleClick}
          >
            <cylinderGeometry args={[0.075, 0.075, 0.2, 32]} />
            <meshStandardMaterial opacity={0} transparent />
          </mesh>
        </group>
      )}
    </>
  )
}
