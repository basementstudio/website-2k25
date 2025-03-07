import { animate } from "motion"
import { useCallback, useEffect, useRef } from "react"
import { Mesh } from "three"

import { useAssets } from "@/components/assets-provider"

import { useCurrentScene } from "@/hooks/use-current-scene"
import { useSiteAudio } from "@/hooks/use-site-audio"

import { BOARD_ANGLE, BUTTON_ANIMATION } from "./constants"
import { useCursor } from "@/hooks/use-mouse"

const VALID_BUTTONS = {
  "02_BT_10": "b",
  "02_BT_13": "a"
} as const

export const Button = ({ button }: { button: Mesh }) => {
  const scene = useCurrentScene()
  const setCursor = useCursor()

  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()
  const availableSounds = sfx.arcade.buttons.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))
  const isPressed = useRef(false)

  const handleButtonInteraction = useCallback(
    (isDown: boolean) => {
      if (scene !== "lab") return

      // dispatch button event
      if (isDown && button.name in VALID_BUTTONS) {
        window.dispatchEvent(
          new CustomEvent("buttonPressed", {
            detail: { buttonName: button.name }
          })
        )
      }

      const angle = BOARD_ANGLE * (Math.PI / 180)
      const offset = isDown ? -0.0075 : 0
      const targetPosition = {
        x: button.userData.originalPosition.x,
        y: button.userData.originalPosition.y + offset * Math.sin(angle),
        z: button.userData.originalPosition.z + offset * Math.cos(angle)
      }

      playSoundFX(
        `ARCADE_BUTTON_${desiredSoundFX.current}_${isDown ? "PRESS" : "RELEASE"}`,
        0.2
      )

      if (isDown) {
        desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
      }

      animate(button.position, targetPosition, BUTTON_ANIMATION)
    },
    [
      scene,
      button.name,
      button.userData.originalPosition,
      button.position,
      playSoundFX
    ]
  )

  // keyboard controls
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (scene !== "lab") return

      const isKeyDown = event.type === "keydown"
      const buttonKey = VALID_BUTTONS[button.name as keyof typeof VALID_BUTTONS]

      if (buttonKey && event.key.toLowerCase() === buttonKey) {
        if (isKeyDown && !isPressed.current) {
          isPressed.current = true
          handleButtonInteraction(true)
        } else if (!isKeyDown && isPressed.current) {
          isPressed.current = false
          handleButtonInteraction(false)
        }
      }
    }

    window.addEventListener("keydown", handleKey)
    window.addEventListener("keyup", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
      window.removeEventListener("keyup", handleKey)
    }
  }, [scene, button.name, handleButtonInteraction])

  return (
    <group key={button.name}>
      <primitive object={button} />
      <mesh
        position={button.position}
        scale={[1, 0.6, 1]}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setCursor("pointer")
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          setCursor("pointer")
          isPressed.current = true
          handleButtonInteraction(true)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          if (isPressed.current) {
            isPressed.current = false
            handleButtonInteraction(false)
          }
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setCursor("default")
          if (isPressed.current) {
            isPressed.current = false
            handleButtonInteraction(false)
          }
        }}
      >
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
