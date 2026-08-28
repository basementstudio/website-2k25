import { MeshDiscardMaterial } from "@react-three/drei"
import type { ThreeEvent } from "@react-three/fiber"
import { animate } from "motion"
import type { RefObject } from "react"
import { useCallback, useEffect, useRef } from "react"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import type { ArcadeStick } from "@/hooks/use-mesh"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useArcadeStore } from "@/store/arcade-store"

import { checkKonamiSequence } from "./check-sequence"
import {
  KEY_DIRECTION_MAP,
  STICK_ANIMATION,
  STICK_MORPH_MAX
} from "./constants"

interface StickProps {
  stick: ArcadeStick
  sequence: RefObject<(number | string)[]>
}

/**
 * Map a direction (see KEY_DIRECTION_MAP) to the joystick's two morph influences.
 * morphX <- old rotation.x axis (Up = -, Down = +)
 * morphY <- old rotation.z axis (Right = -, Left = +)
 */
const directionToMorph = (direction: number) => ({
  x:
    direction === 3
      ? -STICK_MORPH_MAX
      : direction === 4
        ? STICK_MORPH_MAX
        : 0,
  y:
    direction === 1
      ? -STICK_MORPH_MAX
      : direction === 2
        ? STICK_MORPH_MAX
        : 0
})

export const Stick = ({ stick, sequence }: StickProps) => {
  const scene = useCurrentScene()
  const { playSoundFX } = useSiteAudio()
  const { sfx } = useAssets()
  const isInGame = useArcadeStore((state) => state.isInGame)
  const setIsInGame = useArcadeStore((state) => state.setIsInGame)

  const availableSounds = sfx.arcade.sticks.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))
  const state = useRef(0)
  // motion mutates this in place; onUpdate copies it into the two morphs
  const tilt = useRef({ x: 0, y: 0 })

  const navigationTimer = useRef<NodeJS.Timeout | null>(null)
  const setCursor = useCursor()
  const { setLabTabIndex, setIsInLabTab, setIsSourceButtonSelected } =
    useArcadeStore()

  const isDragging = useRef(false)
  const dragStartPosition = useRef({ x: 0, y: 0 })

  const handleStickSound = useCallback(
    (isRelease: boolean) => {
      if (state.current !== 0) {
        desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
      }
      playSoundFX(
        `ARCADE_STICK_${desiredSoundFX.current}_${isRelease ? "RELEASE" : "PRESS"}`,
        0.2
      )
    },
    [availableSounds, playSoundFX]
  )

  const dispatchStickMoveEvent = useCallback(
    (direction: number) => {
      if (isInGame) {
        const event = new CustomEvent("arcadeStickMove", {
          detail: {
            direction,
            stick: stick.name
          }
        })
        window.dispatchEvent(event)
      }
    },
    [isInGame, stick.name]
  )

  const handleLabNavigation = useCallback(
    (direction: number) => {
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
          } else if (currentLabTabs[currentLabTabIndex]?.type !== "featured") {
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
            const prevTab = currentLabTabs[currentLabTabIndex - 1]
            const currentTab = currentLabTabs[currentLabTabIndex]
            const blockedUp =
              currentTab?.type === "featured" && prevTab?.type === "featured"
            if (!blockedUp) {
              setLabTabIndex(currentLabTabIndex - 1)
              setIsSourceButtonSelected(false)
            }
          } else if (currentLabTabIndex === 1) {
            setLabTabIndex(0)
            setIsSourceButtonSelected(false)
          }
          break

        case 1: {
          // RIGHT
          const currentTab = currentLabTabs[currentLabTabIndex]
          if (
            currentTab?.type === "experiment" &&
            !currentIsSourceButtonSelected
          ) {
            setIsSourceButtonSelected(true)
          } else if (
            currentTab?.type === "featured" &&
            currentLabTabs[currentLabTabIndex + 1]?.type === "featured"
          ) {
            const nextIndex = currentLabTabIndex + 1
            if (nextIndex < currentLabTabs.length) {
              setLabTabIndex(nextIndex)
              setIsSourceButtonSelected(false)
            }
          }
          break
        }

        case 2: // LEFT
          if (currentIsSourceButtonSelected) {
            setIsSourceButtonSelected(false)
          } else if (
            currentLabTabs[currentLabTabIndex]?.type === "featured" &&
            currentLabTabs[currentLabTabIndex - 1]?.type === "featured"
          ) {
            setLabTabIndex(currentLabTabIndex - 1)
            setIsSourceButtonSelected(false)
          }
          break
      }
    },
    [setLabTabIndex, setIsSourceButtonSelected, setIsInLabTab]
  )

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

  const updateStickPosition = useCallback(
    (direction: number, isKeyboardInput: boolean = false) => {
      if (direction !== 0 && state.current === direction) return

      // drive the two morph influences (spring, same feel as before)
      const controls = useMesh.getState().arcade.controls
      const influences = controls?.morphTargetInfluences
      if (influences) {
        const target = directionToMorph(direction)
        animate(tilt.current, target, {
          ...STICK_ANIMATION,
          onUpdate: () => {
            influences[stick.morphX] = tilt.current.x
            influences[stick.morphY] = tilt.current.y
          }
        })
      }

      if (direction !== 0) {
        sequence.current.push(direction)
        checkKonamiSequence({ sequence: sequence.current, setIsInGame })
      }

      handleStickSound(direction === 0)
      state.current = direction

      if (isKeyboardInput && isInGame) {
        return
      }

      dispatchStickMoveEvent(direction)
      if (!isInGame) {
        handleContinuousNavigation(direction)
      }
    },
    [
      stick.morphX,
      stick.morphY,
      handleStickSound,
      dispatchStickMoveEvent,
      isInGame,
      sequence,
      setIsInGame,
      handleContinuousNavigation
    ]
  )

  const handleKeyboardInput = useCallback(
    (direction: number) => {
      updateStickPosition(direction, true)
    },
    [updateStickPosition]
  )

  const resetStick = useCallback(() => {
    state.current = 0
    updateStickPosition(0)
  }, [updateStickPosition])

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (scene !== "lab" && !isInGame) return

      e.stopPropagation()
      isDragging.current = true
      dragStartPosition.current = { x: e.clientX, y: e.clientY }
      setCursor("grabbing")

      const target = e.target as unknown as HTMLElement
      if (target && "setPointerCapture" in target) {
        target.setPointerCapture(e.pointerId)
      }
    },
    [scene, isInGame, setCursor]
  )

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current) return

      const deltaX = e.clientX - dragStartPosition.current.x
      const deltaY = e.clientY - dragStartPosition.current.y

      let direction = 0
      const threshold = 20

      if (Math.abs(deltaX) <= threshold && Math.abs(deltaY) <= threshold) {
        if (state.current !== 0) {
          updateStickPosition(0)
        }
        return
      }

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
        updateStickPosition(direction)
      }
    },
    [updateStickPosition]
  )

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current) return

      isDragging.current = false
      setCursor("grab")

      const target = e.target as unknown as HTMLElement
      if (target && "releasePointerCapture" in target) {
        target.releasePointerCapture(e.pointerId)
      }

      if (state.current !== 0) {
        handleStickSound(true)
        resetStick()
      }
    },
    [handleStickSound, resetStick, setCursor]
  )

  useEffect(() => {
    if (scene !== "lab" || stick.name !== "02_JYTK_L") return

    const handleKeyDown = (event: KeyboardEvent) => {
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
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        handleKeyboardInput(0)
      }
    }

    window.addEventListener("keydown", handleKeyDown, { passive: true })
    window.addEventListener("keyup", handleKeyUp, { passive: true })

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyboardInput, scene, stick.name])

  useEffect(() => {
    return () => {
      if (navigationTimer.current) {
        clearInterval(navigationTimer.current)
        navigationTimer.current = null
      }
    }
  }, [])

  return (
    <group
      onPointerEnter={() => setCursor("grab")}
      onPointerLeave={() => !isDragging.current && setCursor("default")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <mesh
        position={stick.center}
        rotation={[(16 * Math.PI) / 180, 0, 0]}
      >
        <cylinderGeometry args={[0.03, 0.03, 0.12, 12]} />
        <MeshDiscardMaterial />
      </mesh>
    </group>
  )
}
