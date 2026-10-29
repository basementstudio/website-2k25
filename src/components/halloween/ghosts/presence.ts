import { type Vector3 } from "three"

// Shared mutable positions let the pets notice a visible indoor ghost
// without re-rendering React or depending on the ghost's animation path.
export interface GhostPresence {
  position: Vector3
  opacity: number
}
export const indoorGhosts = new Set<GhostPresence>()
