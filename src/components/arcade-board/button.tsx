import { MeshDiscardMaterial } from "@react-three/drei"
import { animate } from "motion"
import { memo, useCallback, useEffect, useRef } from "react"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import type { ArcadeButton } from "@/hooks/use-mesh"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"

import { BUTTON_ANIMATION } from "./constants"

const VALID_BUTTONS = {
  "02_BT_10": "b",
  "02_BT_13": "a"
} as const

const SECONDARY_BUTTONS = {
  "02_BT_4": "b",
  "02_BT_7": "a"
} as const

interface ButtonProps {
  button: ArcadeButton
}

export const Button = memo(function ButtonInner({ button }: ButtonProps) {
  const scene = useCurrentScene()
  const setCursor = useCursor()

  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()
  const availableSounds = sfx.arcade.buttons.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))
  const isPressed = useRef(false)
  // motion mutates this object in place; onUpdate copies it into the morph
  const press = useRef({ v: 0 })

  const handleButtonInteraction = useCallback(
    (isDown: boolean) => {
      if (scene !== "lab") return

      // dispatch button event (konami / game)
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

      playSoundFX(
        `ARCADE_BUTTON_${desiredSoundFX.current}_${isDown ? "PRESS" : "RELEASE"}`,
        0.35
      )
      if (isDown) {
        desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
      }

      // drive the button's morph target: 0 = rest, 1 = pressed (-0.0075)
      const controls = useMesh.getState().arcade.controls
      const influences = controls?.morphTargetInfluences
      if (!influences) return

      animate(
        press.current,
        { v: isDown ? 1 : 0 },
        {
          ...BUTTON_ANIMATION,
          onUpdate: () => {
            influences[button.morphIndex] = press.current.v
          }
        }
      )
    },
    [scene, button.name, button.morphIndex, playSoundFX, availableSounds]
  )

  // keyboard controls (a / b)
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
    <mesh
      position={button.center}
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
  )
})
