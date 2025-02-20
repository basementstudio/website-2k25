import { animate } from "motion"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useMesh } from "@/hooks/use-mesh"

export const ArcadeBoard = () => {
  const {
    arcade: { buttons, sticks }
  } = useMesh()
  const { setCursorType } = useMouseStore()

  const handleClick = (buttonName: string, isDown: boolean) => {
    const angle = 69 * (Math.PI / 180)
    const dz = -0.0075 * Math.cos(angle)
    const dy = -0.0075 * Math.sin(angle)

    const button = buttons?.find((b) => b.name === buttonName)
    if (!button) return

    const targetPosition = {
      x: button.userData.originalPosition.x,
      y: button.userData.originalPosition.y + (isDown ? dy : 0),
      z: button.userData.originalPosition.z + (isDown ? dz : 0)
    }

    animate(button.position, targetPosition, {
      type: "spring",
      stiffness: 2000,
      damping: 64,
      restDelta: 0
    })
  }

  return (
    <group>
      {buttons?.map((button) => (
        <group key={button.name}>
          <primitive object={button} />
          <mesh
            position={button.position}
            scale={[1, 0.6, 1]}
            onPointerEnter={(e) => {
              e.stopPropagation()
              setCursorType("hover")
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              setCursorType("click")
              handleClick(button.name, true)
            }}
            onPointerUp={(e) => {
              e.stopPropagation()
              handleClick(button.name, false)
            }}
            onPointerLeave={(e) => {
              e.stopPropagation()
              setCursorType("default")
              handleClick(button.name, false)
            }}
          >
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshBasicMaterial opacity={0} transparent />
          </mesh>
        </group>
      ))}
      {sticks?.map((stick) => <primitive key={stick.name} object={stick} />)}
    </group>
  )
}
