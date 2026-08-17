import { create } from "zustand"

export const RUBIKS_BEST_TIME_KEY = "rubiks-best-time"

export interface RubiksStore {
  /** A pointer drag started on a cubelet — blocks the inspectable orbit. */
  isCubeDragging: boolean
  /** A layer is spring-snapping to its resting angle. */
  isTurning: boolean
  solved: boolean
  /** Wall-clock ms when the cube left the solved state; null while solved. */
  startedAt: number | null
  /** Duration of the last completed solve, in ms. */
  solveTime: number | null
  /** Fastest solve in this browser, in ms. */
  bestTime: number | null
}

export const useRubiksStore = create<RubiksStore>()(() => ({
  isCubeDragging: false,
  isTurning: false,
  solved: true,
  startedAt: null,
  solveTime: null,
  bestTime: null
}))
