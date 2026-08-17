import { create } from "zustand"

export interface RubiksStore {
  /** A pointer drag started on a cubelet — blocks the inspectable orbit. */
  isCubeDragging: boolean
  /** A layer is spring-snapping to its resting angle. */
  isTurning: boolean
  solved: boolean
}

export const useRubiksStore = create<RubiksStore>()(() => ({
  isCubeDragging: false,
  isTurning: false,
  solved: true
}))
