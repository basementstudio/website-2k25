import { KeyboardControls, PerspectiveCamera } from "@react-three/drei"
import { useKeyboardControls } from "@react-three/drei"
import { type ComponentRef, useEffect, useMemo, useRef, useState } from "react"
import { Euler, Vector3 } from "three"

import { useFrameCallback } from "@/hooks/use-pausable-time"

import { useNavigationStore } from "../navigation-handler/navigation-store"

enum Controls {
  forward = "forward",
  backward = "backward",
  left = "left",
  right = "right",
  up = "up",
  down = "down",
  fast = "fast",
  fov = "fov"
}

export function WasdControls() {
  return (
    <KeyboardControls
      map={[
        { name: Controls.forward, keys: ["ArrowUp", "w", "W"] },
        { name: Controls.backward, keys: ["ArrowDown", "s", "S"] },
        { name: Controls.left, keys: ["ArrowLeft", "a", "A"] },
        { name: Controls.right, keys: ["ArrowRight", "d", "D"] },
        { name: Controls.up, keys: ["e"] },
        { name: Controls.down, keys: ["q"] },
        { name: Controls.fast, keys: ["ShiftLeft", "ShiftRight"] },
        { name: Controls.fov, keys: ["f"] }
      ]}
    >
      <ControlsInner />
    </KeyboardControls>
  )
}

function ControlsInner() {
  const mainCamera = useNavigationStore((s) => s.mainCamera)
  const [, get] = useKeyboardControls<Controls>()

  const fov = useKeyboardControls<Controls>((s) => s.fov)

  const cameraRef = useRef<ComponentRef<typeof PerspectiveCamera>>(null)
  const vectors = useMemo(
    () => ({
      moveTo: new Vector3(),
      cameraEuler: new Euler()
    }),
    []
  )

  vectors.cameraEuler.order = "YXZ"

  useFrameCallback(() => {
    if (!cameraRef.current) return
    const controls = get()
    if (!controls) return

    const { forward, backward, left, right, up, down, fast } = controls

    const speed = fast ? 0.1 : 0.05

    vectors.moveTo.set(
      left ? -speed : right ? speed : 0,
      0,
      forward ? -speed : backward ? speed : 0
    )

    vectors.cameraEuler.copy(cameraRef.current.rotation)
    vectors.moveTo.applyEuler(vectors.cameraEuler)
    vectors.moveTo.y += up ? speed : down ? -speed : 0

    cameraRef.current.position.add(vectors.moveTo)
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const controller = new AbortController()
    const signal = controller.signal

    let isPointerDown = false
    let isContextMenu = false

    // Capture clicks
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement
      const isLevaElement = target.closest('[class^="leva-c-"]')
      if (isLevaElement) return
      isPointerDown = true
      document.body.requestPointerLock()
    }
    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isLevaElement = target.closest('[class^="leva-c-"]')
      if (isLevaElement) return
      event.preventDefault()
      document.body.requestPointerLock()
      isContextMenu = true
    }

    // Cleanup
    const onPointerUp = () => {
      isPointerDown = false
      isContextMenu = false
      try {
        document.exitPointerLock()
      } catch (_) {}
    }

    // Capture pointer movement
    const onPointerMove = (event: PointerEvent) => {
      if (!isPointerDown) return

      const camera = cameraRef.current
      if (!camera) return

      if (isContextMenu) {
        // pan

        vectors.moveTo.set(event.movementX * 0.004, event.movementY * -0.004, 0)
        vectors.cameraEuler.copy(camera.rotation)
        vectors.moveTo.applyEuler(vectors.cameraEuler)
        camera.position.add(vectors.moveTo)
      } else {
        // rotate
        camera.rotation.reorder("YXZ")
        camera.rotation.x -= event.movementY * 0.003
        camera.rotation.y -= event.movementX * 0.003
        camera.rotation.z = 0
      }
    }

    window.addEventListener("pointerdown", onPointerDown, {
      signal,
      passive: true
    })
    window.addEventListener("pointermove", onPointerMove, {
      signal,
      passive: true
    })
    window.addEventListener("pointerup", onPointerUp, { signal, passive: true })
    window.addEventListener("contextmenu", onContextMenu, { signal })

    return () => {
      controller.abort()
      try {
        document.exitPointerLock()
      } catch (_) {}
    }
  }, [])

  const [bigFov, setBigFov] = useState(false)

  useEffect(() => {
    if (!fov) return
    setBigFov((current) => !current)
  }, [fov])

  return (
    <>
      <PerspectiveCamera
        makeDefault
        ref={cameraRef}
        fov={bigFov ? 50 : 70}
        rotation={mainCamera?.rotation}
        position={mainCamera?.position}
      />
    </>
  )
}
