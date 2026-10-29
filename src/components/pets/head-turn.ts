import { type Bone, type Quaternion } from "three"

// AnimationMixer can skip writes when a track is constant. Always remove
// our previous offset before it runs, then capture its current pose again.
export const createHeadTurn = (head: Bone) => {
  const base = head.quaternion.clone()
  let applied = false
  return {
    restore: () => {
      if (applied) head.quaternion.copy(base)
      applied = false
    },
    apply: (offset: Quaternion) => {
      base.copy(head.quaternion)
      head.quaternion.premultiply(offset)
      applied = true
    }
  }
}
