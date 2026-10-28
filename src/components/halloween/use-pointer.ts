import { useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { Vector2 } from "three"

// Share pointer presence rules between seasonal interactions. An untouched
// canvas must not react to R3F's initial pointer at the center of the screen.
export const useHalloweenPointer = () => {
  const canvas = useThree((state) => state.gl.domElement)
  const pointer = useMemo(
    () => ({ position: new Vector2(), active: false }),
    []
  )

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.active =
        rect.width > 0 &&
        rect.height > 0 &&
        event.pointerType !== "touch" &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      if (!pointer.active) return
      pointer.position.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2
      )
    }
    const leave = () => {
      pointer.active = false
    }
    const out = (event: PointerEvent) => {
      if (!event.relatedTarget) leave()
    }
    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerout", out)
    window.addEventListener("blur", leave)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerout", out)
      window.removeEventListener("blur", leave)
    }
  }, [canvas, pointer])

  return pointer
}
