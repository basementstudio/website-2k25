import { ValueAnimationTransition } from "motion/react"

export const MIN_OFFSET = 0.02
export const MAX_TILT = 0.15
export const BOARD_ANGLE = 69

export const BUTTON_ANIMATION: ValueAnimationTransition = {
  type: "spring",
  stiffness: 2000,
  damping: 64,
  restDelta: 0
}

export const STICK_ANIMATION: ValueAnimationTransition = {
  type: "spring",
  stiffness: 2000,
  damping: 64,
  restDelta: 0
}
