import { useEffect, useMemo } from "react"
import { Color } from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { fogConfig } from "@/components/postprocessing/renderer"
import { FOG_AMOUNT, FOG_COLOR } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

const LIGHTNING_TINT = new Color(0.6, 0.7, 1)

// The fog itself is drawn by the post pass; this just switches it on.
export const HalloweenFog = () => {
  const { fadeFactor } = useFadeAnimation()
  const baseColor = useMemo(() => new Color(FOG_COLOR), [])

  useEffect(() => {
    return () => {
      fogConfig.amount = 0
    }
  }, [])

  useFrameCallback(() => {
    // Thin out with the rest of the scene while inspecting.
    fogConfig.amount = FOG_AMOUNT * (1 - fadeFactor.current.get() * 0.85)
    // Goes dim with a power cut and lights up with the storm's strikes.
    fogConfig.color
      .copy(baseColor)
      .multiplyScalar(0.25 + 0.75 * lightFlickerUniform.value)
    fogConfig.color.r += LIGHTNING_TINT.r * lightningUniform.value * 0.5
    fogConfig.color.g += LIGHTNING_TINT.g * lightningUniform.value * 0.5
    fogConfig.color.b += LIGHTNING_TINT.b * lightningUniform.value * 0.5
  })

  return null
}
