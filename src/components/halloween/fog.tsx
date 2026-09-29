import { useEffect } from "react"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { fogConfig } from "@/components/postprocessing/renderer"
import { FOG_AMOUNT, FOG_COLOR } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"

// The fog itself is drawn by the post pass; this just switches it on.
export const HalloweenFog = () => {
  const { fadeFactor } = useFadeAnimation()

  useEffect(() => {
    fogConfig.color.set(FOG_COLOR)
    return () => {
      fogConfig.amount = 0
    }
  }, [])

  useFrameCallback(() => {
    // Thin out with the rest of the scene while inspecting.
    fogConfig.amount = FOG_AMOUNT * (1 - fadeFactor.current.get() * 0.85)
  })

  return null
}
