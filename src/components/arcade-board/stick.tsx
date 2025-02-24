import { ThreeEvent } from "@react-three/fiber"
import { animate } from "motion"
import { useRef, useState, useEffect, useCallback } from "react"
import { Mesh } from "three"

import { useAssets } from "@/components/assets-provider"
import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useKeyPress } from "@/hooks/use-key-press"

import { BOARD_ANGLE, MAX_TILT, MIN_OFFSET, STICK_ANIMATION } from "./constants"
import { useArcadeStore } from "@/store/arcade-store"

export const Stick = ({ stick, offsetX }: { stick: Mesh; offsetX: number }) => {
  const scene = useCurrentScene()
  const { setCursorType } = useMouseStore()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()
  const setHasUnlockedKonami = useArcadeStore(
    (state) => state.setHasUnlockedKonami
  )

  const availableSounds = sfx.arcade.sticks.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))

  const [stickIsGrabbed, setStickIsGrabbed] = useState(false)
  const state = useRef(0)
  const sequence = useRef<number[]>([])
  const expectedSequence = [
    3,
    0,
    3,
    0,
    4,
    0,
    4,
    0,
    2,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    "02_BT_7",
    "02_BT_4"
  ]

  const handleGrabStick = () => {
    if (scene !== "lab") return
    setStickIsGrabbed(true)
    setCursorType("grabbing")
  }

  const handleReleaseStick = () => {
    if (scene !== "lab") return
    setStickIsGrabbed(false)
    resetStick()
  }

  const checkSequence = () => {
    const seqLength = sequence.current.length
    if (seqLength > expectedSequence.length) {
      sequence.current = sequence.current.slice(-expectedSequence.length)
    }

    const filteredSequence = sequence.current.filter((value) => value !== 0)
    const filteredExpected = expectedSequence.filter((value) => value !== 0)

    if (filteredSequence.length === filteredExpected.length) {
      if (
        filteredSequence.every(
          (value, index) => value === filteredExpected[index]
        )
      ) {
        console.log("EXTENDED KONAMI CODE UNLOCKED")
        setHasUnlockedKonami(true)
        sequence.current = []
      }
    }
  }

  const handleKeyboardInput = useCallback(
    (direction: number) => {
      if (scene !== "lab") return
      if (stick.name !== "02_JYTK_R") return

      const targetRotation = {
        x: direction === 3 ? -MAX_TILT : direction === 4 ? MAX_TILT : 0,
        y: 0,
        z: direction === 1 ? -MAX_TILT : direction === 2 ? MAX_TILT : 0
      }

      if (state.current !== direction) {
        if (state.current !== 0) {
          desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
        }

        animate(stick.rotation, targetRotation, STICK_ANIMATION)

        sequence.current.push(direction)
        checkSequence()

        playSoundFX(
          `ARCADE_STICK_${desiredSoundFX.current}_${
            direction === 0 ? "RELEASE" : "PRESS"
          }`,
          0.2
        )

        state.current = direction
      }
    },
    [scene, stick.name, availableSounds, playSoundFX]
  )

  const handleKeyUp = useCallback(() => {
    if (scene !== "lab" || stick.name !== "02_JYTK_R") return
    handleKeyboardInput(3)
    setTimeout(() => handleKeyboardInput(0), 100)
  }, [scene, stick.name, handleKeyboardInput])

  const handleKeyDown = useCallback(() => {
    if (scene !== "lab" || stick.name !== "02_JYTK_R") return
    handleKeyboardInput(4)
    setTimeout(() => handleKeyboardInput(0), 100)
  }, [scene, stick.name, handleKeyboardInput])

  const handleKeyLeft = useCallback(() => {
    if (scene !== "lab" || stick.name !== "02_JYTK_R") return
    handleKeyboardInput(2)
    setTimeout(() => handleKeyboardInput(0), 100)
  }, [scene, stick.name, handleKeyboardInput])

  const handleKeyRight = useCallback(() => {
    if (scene !== "lab" || stick.name !== "02_JYTK_R") return
    handleKeyboardInput(1)
    setTimeout(() => handleKeyboardInput(0), 100)
  }, [scene, stick.name, handleKeyboardInput])

  useKeyPress("ArrowUp", handleKeyUp)
  useKeyPress("ArrowDown", handleKeyDown)
  useKeyPress("ArrowLeft", handleKeyLeft)
  useKeyPress("ArrowRight", handleKeyRight)

  const handleStickMove = (e: ThreeEvent<PointerEvent>) => {
    const x = e.point.x - e.eventObject.position.x + offsetX
    const y = e.point.y - e.eventObject.position.y

    const absX = Math.abs(x)
    const absZ = Math.abs(y)

    let targetRotation
    let currentState

    if (absX < MIN_OFFSET && absZ < MIN_OFFSET) {
      targetRotation = {
        x: 0,
        y: 0,
        z: 0
      }
      currentState = 0
    } else if (absX > absZ) {
      targetRotation = {
        x: 0,
        y: 0,
        z: x > 0 ? -MAX_TILT : MAX_TILT
      }
      currentState = x > 0 ? 1 : 2
    } else {
      targetRotation = {
        x: y > 0 ? -MAX_TILT : MAX_TILT,
        y: 0,
        z: 0
      }
      currentState = y > 0 ? 3 : 4
    }

    if (state.current === currentState) return

    if (state.current !== 0) {
      desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
    }

    animate(stick.rotation, targetRotation, STICK_ANIMATION)

    sequence.current.push(currentState)
    checkSequence()

    playSoundFX(
      `ARCADE_STICK_${desiredSoundFX.current}_${
        currentState === 0 ? "RELEASE" : "PRESS"
      }`,
      0.2
    )

    state.current = currentState
  }

  const resetStick = () => {
    animate(
      stick.rotation,
      {
        x: 0,
        y: 0,
        z: 0
      },
      STICK_ANIMATION
    )

    if (state.current !== 0) {
      playSoundFX(`ARCADE_STICK_${desiredSoundFX.current}_RELEASE`, 0.2)
    }
    state.current = 0
  }

  useEffect(() => {
    const handleButtonPress = (event: CustomEvent) => {
      const buttonName = event.detail.buttonName
      sequence.current.push(buttonName)
      checkSequence()
    }

    window.addEventListener("buttonPressed", handleButtonPress as EventListener)
    return () => {
      window.removeEventListener(
        "buttonPressed",
        handleButtonPress as EventListener
      )
    }
  }, [])

  return (
    <group key={stick.name}>
      <primitive object={stick} />
      <mesh
        position={[
          stick.position.x,
          stick.position.y + 0.07 * Math.sin((BOARD_ANGLE * Math.PI) / 180),
          stick.position.z + 0.07 * Math.cos((BOARD_ANGLE * Math.PI) / 180)
        ]}
        rotation={[(16 * Math.PI) / 180, 0, 0]}
        onPointerEnter={() => setCursorType("grab")}
        onPointerLeave={() => {
          if (!stickIsGrabbed) setCursorType("default")
        }}
        onPointerDown={() => handleGrabStick()}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.06, 12]} />
        <meshBasicMaterial opacity={0} transparent />
      </mesh>
      <mesh
        position={[
          stick.position.x,
          stick.position.y + 0.07 * Math.sin((BOARD_ANGLE * Math.PI) / 180),
          stick.position.z + 0.07 * Math.cos((BOARD_ANGLE * Math.PI) / 180)
        ]}
        onPointerMove={(e) => {
          if (stickIsGrabbed) {
            e.stopPropagation()
            handleStickMove(e)
          }
        }}
        onPointerLeave={(e) => {
          if (stickIsGrabbed) {
            e.stopPropagation()
            setCursorType("default")
            handleReleaseStick()
          }
        }}
        onPointerUp={(e) => {
          if (stickIsGrabbed) {
            setCursorType(state.current === 0 ? "grab" : "default")
            handleReleaseStick()
          }
        }}
      >
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial opacity={0} transparent />
      </mesh>
    </group>
  )
}
