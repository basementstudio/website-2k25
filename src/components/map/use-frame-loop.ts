import { useRef } from "react"
import { Vector2 } from "three"

import { useInspectable } from "@/components/inspectables/context"
import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useIdleHint } from "@/hooks/use-idle-hint"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useCustomShaderMaterial } from "@/shaders/material-global-shader"

// Seconds of no pointer movement (and nothing selected) before the idle
// hint starts easing in.
const IDLE_DELAY = 4
// Factor units/second for the ease in/out — quick enough to feel responsive
// to a click or a mouse nudge, slow enough to still read as "subtle".
const IDLE_EASE_SPEED = 1.5
// Below this squared NDC delta, pointer movement is treated as noise (the
// pointer legitimately doesn't move a single float bit while genuinely
// idle, but this guards against floating point jitter).
const POINTER_MOVE_EPSILON = 1e-7

export const useFrameLoop = () => {
  const shaderMaterial = useCustomShaderMaterial((store) => store.materialsRef)
  const { fadeFactor, inspectingEnabled } = useFadeAnimation()
  const { selected } = useInspectable()

  const lastPointer = useRef(new Vector2())
  const idleTime = useRef(0)
  const idleFactor = useRef(0)

  useFrameCallback((state, delta) => {
    Object.values(shaderMaterial).forEach((material) => {
      material.uniforms.uTime.value += delta

      material.uniforms.inspectingEnabled.value = inspectingEnabled.current
      material.uniforms.fadeFactor.value = fadeFactor.current.get()
    })

    if (useMesh.getState().cctv?.screen?.material) {
      // @ts-ignore
      useMesh.getState().cctv.screen.material.uniforms.uTime.value += delta
    }

    // Idle hint: nudges the user toward inspectable items with a subtle
    // rim-light pulse (fragment.glsl's hintFactor) after a few seconds of no
    // pointer movement, only while nothing is currently selected. Computed
    // once here and published for every Inspectable instance to read.
    const pointerMoved =
      state.pointer.distanceToSquared(lastPointer.current) >
      POINTER_MOVE_EPSILON
    lastPointer.current.copy(state.pointer)
    idleTime.current = pointerMoved || selected ? 0 : idleTime.current + delta

    const targetIdleFactor = !selected && idleTime.current > IDLE_DELAY ? 1 : 0
    idleFactor.current +=
      (targetIdleFactor - idleFactor.current) *
      Math.min(delta * IDLE_EASE_SPEED, 1)

    if (Math.abs(useIdleHint.getState().factor - idleFactor.current) > 1e-4) {
      useIdleHint.setState({ factor: idleFactor.current })
    }
  })
}
