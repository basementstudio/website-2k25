import { ThreeEvent } from "@react-three/fiber"
import { animate } from "motion"
import { useCallback, useEffect, useRef } from "react"
import { Mesh } from "three"

import { useAssets } from "@/components/assets-provider"

import { useCurrentScene } from "@/hooks/use-current-scene"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useArcadeStore } from "@/store/arcade-store"

import { checkSequence } from "./check-sequence"
import {
  BOARD_ANGLE,
  KEY_DIRECTION_MAP,
  MAX_TILT,
  STICK_ANIMATION
} from "./constants"
import { useCursor } from "@/hooks/use-mouse"

export const Stick = ({ stick }: { stick: Mesh }) => {
  const scene = useCurrentScene()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()
  const setIsInGame = useArcadeStore((state) => state.setIsInGame)
  const isInGame = useArcadeStore((state) => state.isInGame)

  const availableSounds = sfx.arcade.sticks.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))
  const state = useRef(0)
  const sequence = useRef<number[]>([])
  const navigationTimer = useRef<NodeJS.Timeout | null>(null)
  const setCursor = useCursor()
  const { setLabTabIndex, setIsInLabTab, setIsSourceButtonSelected } =
    useArcadeStore()

  const isDragging = useRef(false)
  const dragStartPosition = useRef({ x: 0, y: 0 })

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

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (scene !== "lab" && !isInGame) return
      if (stick.name !== "02_JYTK_L" && !isInGame) return

      e.stopPropagation()
      isDragging.current = true
      dragStartPosition.current = { x: e.clientX, y: e.clientY }
      setCursor("grabbing")

      if (state.current === 0) {
        handleStickSound(false)
      }

      const target = e.target as unknown as HTMLElement
      if (target && "setPointerCapture" in target) {
        target.setPointerCapture(e.pointerId)
      }
    },
    [scene, isInGame, stick.name]
  )

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return

    const deltaX = e.clientX - dragStartPosition.current.x
    const deltaY = e.clientY - dragStartPosition.current.y

    let direction = 0
    const threshold = 10

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        direction =
          deltaX > 0
            ? KEY_DIRECTION_MAP.ArrowRight
            : KEY_DIRECTION_MAP.ArrowLeft
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        direction =
          deltaY > 0 ? KEY_DIRECTION_MAP.ArrowDown : KEY_DIRECTION_MAP.ArrowUp
      }
    }

    if (direction !== 0) {
      const targetRotation = {
        x: direction === 3 ? -MAX_TILT : direction === 4 ? MAX_TILT : 0,
        y: 0,
        z: direction === 1 ? -MAX_TILT : direction === 2 ? MAX_TILT : 0
      }

      updateStickPosition(direction, targetRotation)
    }
  }, [])

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return

    isDragging.current = false
    setCursor("grab")

    const target = e.target as unknown as HTMLElement
    if (target && "releasePointerCapture" in target) {
      target.releasePointerCapture(e.pointerId)
    }

    resetStick()
  }, [])

  useEffect(() => {
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
      <group
        onPointerEnter={() => setCursor("grab")}
        onPointerLeave={() => !isDragging.current && setCursor("default")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <mesh
          position={[
            stick.position.x,
            stick.position.y + 0.05 * Math.sin((BOARD_ANGLE * Math.PI) / 180),
            stick.position.z + 0.05 * Math.cos((BOARD_ANGLE * Math.PI) / 180)
          ]}
          rotation={[(16 * Math.PI) / 180, 0, 0]}
        >
          <cylinderGeometry args={[0.03, 0.03, 0.12, 12]} />
          <meshBasicMaterial opacity={0} transparent />
        </mesh>
      </group>
    </group>
  )
}
