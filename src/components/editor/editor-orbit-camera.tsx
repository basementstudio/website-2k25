"use client"

import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Vector3 } from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import { isTypingTarget } from "./editor-keys"

/** Units per second. The office is ~20 units across, so this crosses it in a
 *  few seconds; hold Shift to sprint. */
const BASE_SPEED = 3.5
const SPRINT_MULTIPLIER = 3

type Action = "forward" | "back" | "left" | "right" | "up" | "down"

// Keyed off `event.code`, so this works the same on AZERTY/Dvorak layouts.
const KEY_MAP: Record<string, Action> = {
  KeyW: "forward",
  KeyS: "back",
  KeyA: "left",
  KeyD: "right",
  KeyE: "up",
  KeyQ: "down"
}

/** Minimal structural type for the OrbitControls instance R3F publishes as
 *  `state.controls` via `makeDefault` — avoids depending on three-stdlib types. */
interface OrbitLike {
  target: Vector3
  update: () => void
}

/**
 * WASD translation layered on top of OrbitControls: W/S forward-back along the
 * view direction, A/D strafe, E/Q up/down in world space, Shift to sprint.
 *
 * Moves `controls.target` by the same delta as the camera. Without that the
 * orbit pivot would stay behind, so the next drag would swing the camera back
 * around the old point instead of orbiting what's now in front of you.
 *
 * `frameloop` is "demand", so nothing renders unless something asks. keydown
 * kicks the first frame and each moving frame requests the next, which keeps the
 * loop alive exactly as long as a key is held.
 */
const WasdMovement = () => {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as OrbitLike | null
  const invalidate = useThree((state) => state.invalidate)

  const pressed = useRef(new Set<Action>())
  const sprinting = useRef(false)

  // Reused so the frame loop doesn't allocate.
  const vectors = useMemo(
    () => ({
      forward: new Vector3(),
      right: new Vector3(),
      move: new Vector3()
    }),
    []
  )

  useEffect(() => {
    // Captured once: the ref's Set identity is stable, and using the local here
    // keeps the cleanup off `pressed.current`.
    const keys = pressed.current

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.shiftKey) sprinting.current = true

      const action = KEY_MAP[event.code]
      if (!action) return

      keys.add(action)
      event.preventDefault()
      invalidate()
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.shiftKey) sprinting.current = false
      const action = KEY_MAP[event.code]
      if (action) keys.delete(action)
    }

    // Losing focus (clicking back into the Studio around the iframe) would
    // otherwise leave a key stuck down and the camera drifting forever.
    const handleBlur = () => {
      keys.clear()
      sprinting.current = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
      keys.clear()
    }
  }, [invalidate])

  useFrame((_, delta) => {
    const keys = pressed.current
    if (keys.size === 0) return

    const { forward, right, move } = vectors
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
    right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    move.set(0, 0, 0)

    if (keys.has("forward")) move.add(forward)
    if (keys.has("back")) move.sub(forward)
    if (keys.has("right")) move.add(right)
    if (keys.has("left")) move.sub(right)
    if (keys.has("up")) move.y += 1
    if (keys.has("down")) move.y -= 1

    if (move.lengthSq() === 0) return

    move
      .normalize()
      .multiplyScalar(
        BASE_SPEED * (sprinting.current ? SPRINT_MULTIPLIER : 1) * delta
      )

    camera.position.add(move)
    controls?.target.add(move)
    controls?.update()

    // Keep the demand-driven loop going while a key is held.
    invalidate()
  }, 0)

  return null
}

/**
 * Free camera for the editor's edit mode — drag to orbit, wheel to zoom,
 * right-drag to pan, WASD to fly.
 *
 * Rendered by CameraController *instead of* <CustomCamera />, never alongside
 * it: CustomCamera lerps the camera toward the scene's configured position every
 * frame, so both mounted at once would fight over the transform. Same reason the
 * existing leva "flyMode" swaps in <WasdControls /> rather than layering it.
 *
 * `makeDefault` mirrors CustomCamera, so CameraController's
 * `useThree().camera` → `setMainCamera` effect keeps publishing the camera the
 * Renderer actually draws with, and makes the controls reachable as
 * `state.controls` for WasdMovement above.
 *
 * Seeded from the current scene's camera config so toggling normal → orbit picks
 * up where the scripted camera left off instead of jumping to the origin.
 */
export const EditorOrbitCamera = () => {
  const currentScene = useNavigationStore((state) => state.currentScene)
  const config = currentScene?.cameraConfig

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={config?.position ?? [0, 0, 5]}
        fov={config?.fov ?? 60}
      />
      <OrbitControls
        makeDefault
        target={config?.target ?? [0, 0, 0]}
        enableDamping
        dampingFactor={0.1}
        // Zoom range wide enough to frame a single prop or the whole office.
        minDistance={0.2}
        maxDistance={60}
      />
      <WasdMovement />
    </>
  )
}
