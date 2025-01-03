import { ValueAnimationTransition } from "motion/react"

export const TARGET_SIZE = 0.5
export const SMOOTH_FACTOR = 0.1
export const X_OFFSET = 0.13

export const ANIMATION_CONFIG: ValueAnimationTransition = {
  stiffness: 100,
  damping: 20,
  restDelta: 0.001,
  type: "spring"
}
