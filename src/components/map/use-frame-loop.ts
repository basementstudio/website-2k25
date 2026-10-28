import { useRef } from "react"
import type { ShaderMaterial } from "three"

import { useAirplaneStore } from "@/components/airplane-mode/store"
import { useInspectable } from "@/components/inspectables/context"
import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useIdleHint } from "@/hooks/use-idle-hint"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useCustomShaderMaterial } from "@/shaders/material-global-shader"

import { useNavigationStore } from "../navigation-handler/navigation-store"

// Seconds spent in the current section (nothing to do with the mouse —
// Nico: "no quiero que dependan del movimiento del mouse") before the idle
// hint starts easing in.
const IDLE_DELAY = 3
// Factor units/second for the ease in/out — quick enough to feel responsive
// to a click, slow enough to still read as "subtle".
const IDLE_EASE_SPEED = 1.5

export const useFrameLoop = () => {
  const shaderMaterial = useCustomShaderMaterial((store) => store.materialsRef)
  const { fadeFactor, inspectingEnabled } = useFadeAnimation()
  const { selected } = useInspectable()

  const lastSceneName = useRef<string | null>(null)
  const sectionTime = useRef(0)
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

    const ipodScreenMaterial = useMesh.getState().ipodScreen
      ?.material as ShaderMaterial
    if (ipodScreenMaterial?.uniforms?.uTime) {
      ipodScreenMaterial.uniforms.uTime.value += delta
      ipodScreenMaterial.uniforms.fadeFactor.value = fadeFactor.current.get()
      ipodScreenMaterial.userData.updateScreen?.(delta)
    }

    // Idle hint: nudges the user toward inspectable items with a subtle
    // rim-light pulse (fragment.glsl's hintFactor) once they've spent a few
    // seconds in the current section, only while nothing is currently
    // selected. Leaving the section (or coming back to it) resets the
    // clock. Computed once here and published for every Inspectable
    // instance to read.
    const sceneName = useNavigationStore.getState().currentScene?.name ?? null
    if (sceneName !== lastSceneName.current) {
      lastSceneName.current = sceneName
      sectionTime.current = 0
    } else {
      sectionTime.current += delta
    }

    // Off entirely while flying — the flying plane shares SM_Plane's
    // material, and nothing's inspectable mid-flight anyway. Cut straight
    // to 0 (no ease-out) and restart the clock so it doesn't pulse the
    // moment the flight ends either.
    const flying = useAirplaneStore.getState().phase !== "off"
    if (flying) {
      sectionTime.current = 0
      idleFactor.current = 0
    } else {
      const targetIdleFactor =
        !selected && sectionTime.current > IDLE_DELAY ? 1 : 0
      idleFactor.current +=
        (targetIdleFactor - idleFactor.current) *
        Math.min(delta * IDLE_EASE_SPEED, 1)
    }

    if (Math.abs(useIdleHint.getState().factor - idleFactor.current) > 1e-4) {
      useIdleHint.setState({ factor: idleFactor.current })
    }
  })
}
