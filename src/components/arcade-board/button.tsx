import { MeshDiscardMaterial } from "@react-three/drei"
import { animate } from "motion"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"

import { useAssets } from "@/components/assets-provider/use-assets"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"

import { BOARD_ANGLE, BUTTON_ANIMATION } from "./constants"

const VALID_BUTTONS = {
  "02_BT_10": "b",
  "02_BT_13": "a"
} as const

const SECONDARY_BUTTONS = {
  "02_BT_4": "b",
  "02_BT_7": "a"
} as const

interface ButtonProps {
  buttonName: string
}

export const Button = memo(function ButtonInner({ buttonName }: ButtonProps) {
  const { arcade } = useMesh()
  const { buttons } = arcade

  const button = useMemo(
    () => buttons?.find((b) => b.name === buttonName),
    [buttons, buttonName]
  )!

  const scene = useCurrentScene()
  const setCursor = useCursor()

  const { playSoundFX } = useSiteAudio()
  const assets = useAssets()
  const availableSounds = assets?.sfx.arcade.buttons.length ?? 0
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))
  const isPressed = useRef(false)

  const handleButtonInteraction = useCallback(
    (isDown: boolean) => {
      if (scene !== "lab") return

      // dispatch button event
      if (
        isDown &&
        (button.name in VALID_BUTTONS || button.name in SECONDARY_BUTTONS)
      ) {
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
        0.35
      )

      if (isDown) {
        desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
      }

      animate(button.position, targetPosition, BUTTON_ANIMATION)
    },
    [
      scene,
      button.name,
      button.userData.originalPosition.x,
      button.userData.originalPosition.y,
      button.userData.originalPosition.z,
      button.position,
      playSoundFX,
      availableSounds
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

    window.addEventListener("keydown", handleKey, { passive: true })
    window.addEventListener("keyup", handleKey, { passive: true })
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
        <MeshDiscardMaterial />
      </mesh>
    </group>
  )
})
