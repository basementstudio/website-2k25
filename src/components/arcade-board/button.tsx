import { animate } from "motion"
import { useRef } from "react"
import { Mesh } from "three"

import { useAssets } from "@/components/assets-provider"
import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useSiteAudio } from "@/hooks/use-site-audio"

import { BOARD_ANGLE, BUTTON_ANIMATION } from "./constants"

export const Button = ({ button }: { button: Mesh }) => {
  const scene = useCurrentScene()
  const { setCursorType } = useMouseStore()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()

  const availableSounds = sfx.arcade.buttons.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))

  const handleClick = (isDown: boolean) => {
    if (scene !== "lab") return

    const angle = BOARD_ANGLE * (Math.PI / 180)
    const dz = -0.0075 * Math.cos(angle)
    const dy = -0.0075 * Math.sin(angle)

    playSoundFX(
      `ARCADE_BUTTON_${desiredSoundFX.current}_${isDown ? "PRESS" : "RELEASE"}`,
      0.2
    )

    if (isDown) {
      desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
    }

    const targetPosition = {
      x: button.userData.originalPosition.x,
      y: button.userData.originalPosition.y + (isDown ? dy : 0),
      z: button.userData.originalPosition.z + (isDown ? dz : 0)
    }

    animate(button.position, targetPosition, BUTTON_ANIMATION)
  }

  const isPressed = useRef(false)

  return (
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
          isPressed.current = true
          handleClick(true)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          if (isPressed.current) {
            isPressed.current = false
            handleClick(false)
          }
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setCursorType("default")
          if (isPressed.current) {
            isPressed.current = false
            handleClick(false)
          }
        }}
      >
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}
