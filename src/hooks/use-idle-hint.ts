import { create } from "zustand"

// Drives the subtle "you can interact with this" rim-light pulse on
// inspectable meshes (see Inspectable's useFrameCallback + fragment.glsl's
// hintFactor). Computed once per frame in map/use-frame-loop.ts from pointer
// idle time, then read (not subscribed to — this changes every frame) by
// each Inspectable instance via useIdleHint.getState().factor.
interface IdleHintState {
  /** Eased 0-1 factor for the idle-hint pulse. 0 while the pointer is
   * moving or anything is selected, eases to 1 after IDLE_DELAY of no
   * pointer movement (see use-frame-loop.ts). */
  factor: number
}

export const useIdleHint = create<IdleHintState>(() => ({
  factor: 0
}))
