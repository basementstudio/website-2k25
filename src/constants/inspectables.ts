import { ValueAnimationTransition } from "motion/react"

export const SMOOTH_FACTOR = 0.1

export const ANIMATION_CONFIG: ValueAnimationTransition = {
  stiffness: 100,
  damping: 20,
  restDelta: 0.001,
  type: "spring"
}
