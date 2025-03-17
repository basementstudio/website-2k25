import { animate, MotionValue } from "motion"
import { AnimationPlaybackControls } from "motion/react"
import { useEffect, useRef } from "react"

import { ANIMATION_CONFIG } from "@/constants/inspectables"

import { useInspectable } from "./context"

export const useFadeAnimation = () => {
  const { selected } = useInspectable()
  const inspectingEnabled = useRef(false)
  const fadeFactor = useRef<MotionValue>(new MotionValue())
  const tl = useRef<AnimationPlaybackControls | null>(null)

  useEffect(() => {
    const easeDirection = selected ? 1 : 0

    if (easeDirection === 1) inspectingEnabled.current = true

    tl.current = animate(fadeFactor.current, easeDirection, ANIMATION_CONFIG)
    tl.current.play()

    return () => tl.current?.stop()
  }, [selected])

  return { fadeFactor, inspectingEnabled }
}
