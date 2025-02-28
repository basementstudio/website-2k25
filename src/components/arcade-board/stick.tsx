import { ThreeEvent } from "@react-three/fiber"
import { animate } from "motion"
import { useRef, useState, useEffect, useCallback } from "react"
import { Mesh } from "three"

import { useAssets } from "@/components/assets-provider"
import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useSiteAudio } from "@/hooks/use-site-audio"

import {
  ArrowKey,
  BOARD_ANGLE,
  KEY_DIRECTION_MAP,
  MAX_TILT,
  MIN_OFFSET,
  STICK_ANIMATION
} from "./constants"
import { useArcadeStore } from "@/store/arcade-store"
import { checkSequence } from "./check-sequence"

export const Stick = ({ stick, offsetX }: { stick: Mesh; offsetX: number }) => {
  const scene = useCurrentScene()
  const { setCursorType } = useMouseStore()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()
  const setIsInGame = useArcadeStore((state) => state.setIsInGame)
  const isInGame = useArcadeStore((state) => state.isInGame)

  const availableSounds = sfx.arcade.sticks.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))
  const [stickIsGrabbed, setStickIsGrabbed] = useState(false)
  const state = useRef(0)
  const sequence = useRef<number[]>([])
  const navigationTimer = useRef<NodeJS.Timeout | null>(null)

  const { setLabTabIndex, setIsInLabTab, setIsSourceButtonSelected } =
    useArcadeStore()

  const handleStickSound = (isRelease: boolean) => {
    if (state.current !== 0) {
      desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
    }
    playSoundFX(
      `ARCADE_STICK_${desiredSoundFX.current}_${isRelease ? "RELEASE" : "PRESS"}`,
      0.2
    )
  }

  const dispatchStickMoveEvent = (direction: number) => {
    if (isInGame) {
      const event = new CustomEvent("arcadeStickMove", {
        detail: { direction }
      })
      window.dispatchEvent(event)
    }
  }

  const updateStickPosition = (
    direction: number,
    targetRotation: { x: number; y: number; z: number }
  ) => {
    if (state.current === direction) return

    animate(stick.rotation, targetRotation, STICK_ANIMATION)

    sequence.current.push(direction)
    checkSequence({ sequence: sequence.current, setIsInGame })
    handleStickSound(direction === 0)
    state.current = direction

    dispatchStickMoveEvent(direction)

    if (!isInGame) {
      handleContinuousNavigation(direction)
    }
  }

  const handleLabNavigation = (direction: number) => {
    if (stick.name !== "02_JYTK_L") return

    setIsInLabTab(true)
    const currentLabTabIndex = useArcadeStore.getState().labTabIndex
    const currentIsSourceButtonSelected =
      useArcadeStore.getState().isSourceButtonSelected
    const currentLabTabs = useArcadeStore.getState().labTabs

    if (currentLabTabIndex === -1) {
      setLabTabIndex(0)
      return
    }

    switch (direction) {
      case 4: // DOWN
        if (currentLabTabIndex === 0) {
          setLabTabIndex(1)
          setIsSourceButtonSelected(false)
        } else if (currentLabTabs[currentLabTabIndex]?.title !== "CHRONICLES") {
          const nextIndex = currentLabTabIndex + 1
          if (nextIndex < currentLabTabs.length) {
            setLabTabIndex(nextIndex)
            setIsSourceButtonSelected(false)
          }
        }
        break

      case 3: // UP
        if (currentIsSourceButtonSelected) {
          setIsSourceButtonSelected(false)
          setLabTabIndex(currentLabTabIndex - 1)
        } else if (currentLabTabIndex > 1) {
          if (
            currentLabTabs[currentLabTabIndex]?.title !== "LOOPER (COMING SOON)"
          ) {
            setLabTabIndex(currentLabTabIndex - 1)
            setIsSourceButtonSelected(false)
          }
        } else if (currentLabTabIndex === 1) {
          setLabTabIndex(0)
          setIsSourceButtonSelected(false)
        }
        break

      case 1: // RIGHT
        const currentTab = currentLabTabs[currentLabTabIndex]
        if (
          currentTab?.type === "experiment" &&
          !currentIsSourceButtonSelected
        ) {
          setIsSourceButtonSelected(true)
        } else if (currentTab?.title === "CHRONICLES") {
          const nextIndex = currentLabTabIndex + 1
          if (nextIndex < currentLabTabs.length) {
            setLabTabIndex(nextIndex)
            setIsSourceButtonSelected(false)
          }
        }
        break

      case 2: // LEFT
        if (currentIsSourceButtonSelected) {
          setIsSourceButtonSelected(false)
        } else if (
          currentLabTabs[currentLabTabIndex]?.title === "LOOPER (COMING SOON)"
        ) {
          setLabTabIndex(currentLabTabIndex - 1)
          setIsSourceButtonSelected(false)
        }
        break
    }
  }

  const handleKeyboardInput = useCallback(
    (direction: number) => {
      if (scene !== "lab" && !isInGame) return

      const targetRotation = {
        x: direction === 3 ? -MAX_TILT : direction === 4 ? MAX_TILT : 0,
        y: 0,
        z: direction === 1 ? -MAX_TILT : direction === 2 ? MAX_TILT : 0
      }

      updateStickPosition(direction, targetRotation)
    },
    [scene, stick.name, availableSounds, playSoundFX, isInGame]
  )

  const handleGrabStick = () => {
    if (scene !== "lab" && !isInGame) return
    setStickIsGrabbed(true)
    setCursorType("grabbing")
  }

  const handleReleaseStick = () => {
    if (scene !== "lab" && !isInGame) return
    setStickIsGrabbed(false)
    resetStick()
  }

  const handleStickMove = (e: ThreeEvent<PointerEvent>) => {
    const x = e.point.x - e.eventObject.position.x + offsetX
    const y = e.point.y - e.eventObject.position.y

    const absX = Math.abs(x)
    const absZ = Math.abs(y)

    let targetRotation
    let currentState

    if (absX < MIN_OFFSET && absZ < MIN_OFFSET) {
      targetRotation = { x: 0, y: 0, z: 0 }
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
    updateStickPosition(currentState, targetRotation)
  }

  const resetStick = () => {
    updateStickPosition(0, { x: 0, y: 0, z: 0 })
  }

  const handleContinuousNavigation = useCallback(
    (direction: number) => {
      if (navigationTimer.current) {
        clearInterval(navigationTimer.current)
        navigationTimer.current = null
      }

      if (direction === 0) {
        return
      }

      handleLabNavigation(direction)

      navigationTimer.current = setInterval(() => {
        handleLabNavigation(direction)
      }, 300)
    },
    [handleLabNavigation]
  )

  useEffect(() => {
    const canvas = document.querySelector("canvas")
    if (canvas) {
      canvas.style.touchAction = "none"
    }

    const handleButtonPress = (event: CustomEvent) => {
      const buttonName = event.detail.buttonName
      sequence.current.push(buttonName)
      checkSequence({ sequence: sequence.current, setIsInGame })
    }

    const handleGameStateChange = () => {
      resetStick()
    }

    window.addEventListener("buttonPressed", handleButtonPress as EventListener)
    window.addEventListener(
      "gameStateChange",
      handleGameStateChange as EventListener
    )

    return () => {
      window.removeEventListener(
        "buttonPressed",
        handleButtonPress as EventListener
      )
      window.removeEventListener(
        "gameStateChange",
        handleGameStateChange as EventListener
      )
    }
  }, [])

  useEffect(() => {
    resetStick()
  }, [isInGame])

  useEffect(() => {
    return () => {
      if (navigationTimer.current) {
        clearInterval(navigationTimer.current)
        navigationTimer.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isInGame) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (scene !== "lab" || isInGame) return
      if (stick.name !== "02_JYTK_L") return

      switch (event.key) {
        case "ArrowUp":
          handleKeyboardInput(KEY_DIRECTION_MAP.ArrowUp)
          break
        case "ArrowDown":
          handleKeyboardInput(KEY_DIRECTION_MAP.ArrowDown)
          break
        case "ArrowLeft":
          handleKeyboardInput(KEY_DIRECTION_MAP.ArrowLeft)
          break
        case "ArrowRight":
          handleKeyboardInput(KEY_DIRECTION_MAP.ArrowRight)
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (scene !== "lab" || isInGame) return
      if (stick.name !== "02_JYTK_L") return

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        handleKeyboardInput(0)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isInGame, handleKeyboardInput, scene, stick.name])

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
          if (!stickIsGrabbed) {
            handleReleaseStick()
            setCursorType("default")
          }
        }}
        onPointerDown={() => handleGrabStick()}
        onPointerUp={() => {
          handleReleaseStick()
          setCursorType(state.current === 0 ? "grab" : "default")
        }}
        onPointerCancel={() => {
          handleReleaseStick()
          setCursorType("default")
        }}
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
            handleStickMove(e)
          }
        }}
        onPointerUp={(e) => {
          if (stickIsGrabbed) {
            handleReleaseStick()
            setCursorType(state.current === 0 ? "grab" : "default")
          }
        }}
        onPointerLeave={(e) => {
          if (stickIsGrabbed) {
            handleReleaseStick()
            setCursorType("default")
          }
        }}
        onPointerCancel={(e) => {
          if (stickIsGrabbed) {
            handleReleaseStick()
            setCursorType("default")
          }
        }}
      >
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial opacity={0} transparent />
      </mesh>
    </group>
  )
}
