import { create } from "zustand"

export const RUBIKS_BEST_TIME_KEY = "rubiks-best-time"

export interface RubiksStore {
  /** A pointer drag started on a cubelet — blocks the inspectable orbit. */
  isCubeDragging: boolean
  /** A layer is spring-snapping to its resting angle. */
  isTurning: boolean
  solved: boolean
  /** Wall-clock ms of the first move of the current attempt; null when idle. */
  startedAt: number | null
  /** Duration of the last completed solve, in ms. */
  solveTime: number | null
  /** Fastest solve in this browser, in ms. */
  bestTime: number | null
  /** User turns in the current attempt. */
  moves: number
  /** The scramble button was pressed; the cube component picks this up. */
  scramblePending: boolean
  /** A scramble sequence is animating — user input is ignored. */
  isScrambling: boolean
}

export const useRubiksStore = create<RubiksStore>()(() => ({
  isCubeDragging: false,
  isTurning: false,
  solved: true,
  startedAt: null,
  solveTime: null,
  bestTime: null,
  moves: 0,
  scramblePending: false,
  isScrambling: false
}))
