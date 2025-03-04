import { ValueAnimationTransition } from "motion/react"

export const DOOR_ANIMATION_OPEN: ValueAnimationTransition = {
  type: "spring",
  stiffness: 250,
  damping: 48,
  restDelta: 0
}

export const DOOR_ANIMATION_CLOSE: ValueAnimationTransition = {
  type: "spring",
  stiffness: 1500,
  damping: 64,
  restDelta: 0
}
