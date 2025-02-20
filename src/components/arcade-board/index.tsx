import { animate } from "motion"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useMesh } from "@/hooks/use-mesh"

import { Stick } from "./stick"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useAssets } from "../assets-provider"
import { useRef } from "react"

export const ArcadeBoard = () => {
  const {
    arcade: { buttons, sticks }
  } = useMesh()

  const { setCursorType } = useMouseStore()
  const { playSoundFX } = useSiteAudio()
  const {
    sfx: {
      arcade: { buttons: buttonSounds }
    }
  } = useAssets()
  const availableSounds = buttonSounds.length
  const somethingIsPressed = useRef(false)

  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))

  const handleClick = (buttonName: string, isDown: boolean) => {
    const angle = 69 * (Math.PI / 180)
    const dz = -0.0075 * Math.cos(angle)
    const dy = -0.0075 * Math.sin(angle)

    playSoundFX(
      `ARCADE_BUTTON_${desiredSoundFX.current}_${isDown ? "PRESS" : "RELEASE"}`,
      0.2
    )

    if (isDown) {
      desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
    }

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
              somethingIsPressed.current = true
              handleClick(button.name, true)
            }}
            onPointerUp={(e) => {
              e.stopPropagation()
              if (somethingIsPressed.current) {
                somethingIsPressed.current = false
                handleClick(button.name, false)
              }
            }}
            onPointerLeave={(e) => {
              e.stopPropagation()
              setCursorType("default")
              if (somethingIsPressed.current) {
                somethingIsPressed.current = false
                handleClick(button.name, false)
              }
            }}
          >
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      ))}
      {sticks?.map((stick) => (
        <Stick
          key={stick.name}
          stick={stick}
          offsetX={stick.name === "02_JYTK_L" ? -0.06 : 0.03}
        />
      ))}
    </group>
  )
}
