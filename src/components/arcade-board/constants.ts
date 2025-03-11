import type { ValueAnimationTransition } from "motion/react"

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

export const EXPECTED_SEQUENCE = [
  3,
  0,
  3,
  0,
  4,
  0,
  4,
  0,
  2,
  0,
  1,
  0,
  2,
  0,
  1,
  0,
  "02_BT_10",
  "02_BT_13"
]

export const KEY_DIRECTION_MAP = {
  ArrowUp: 3,
  ArrowDown: 4,
  ArrowLeft: 2,
  ArrowRight: 1
}

export type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
