import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import { MathUtils, Quaternion, type SkinnedMesh, Vector3 } from "three"

import {
  type GhostPresence,
  indoorGhosts
} from "@/components/halloween/ghosts/presence"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { createHeadTurn } from "./head-turn"

const UP = new Vector3(0, 1, 0)

export const useGhostAttention = (pet: SkinnedMesh, enabled: boolean) => {
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const scratch = useMemo(
    () => ({
      // GLTFLoader sanitizes dots and suffixes duplicate Boston/Puré names.
      head: pet.skeleton.bones.find((bone) =>
        /^spine[._]?011(?:_\d+)?$/.test(bone.name)
      ),
      position: new Vector3(),
      direction: new Vector3(),
      forward: new Vector3(),
      axis: new Vector3(),
      parentRotation: new Quaternion(),
      offset: new Quaternion(),
      turn: new Quaternion(),
      yaw: 0,
      pitch: 0
    }),
    [pet]
  )
  const pose = useMemo(
    () => (scratch.head ? createHeadTurn(scratch.head) : null),
    [scratch]
  )
  useFrame(() => pose?.restore(), -1)
  useEffect(() => () => pose?.restore(), [pose])

  // Registered after useAnimations: apply a small additive turn to the
  // freshly mixed pose, so it never accumulates or replaces the idle clip.
  useFrameCallback((_, delta) => {
    const head = scratch.head
    if (!head?.parent || !pet.parent || !pose) return
    head.getWorldPosition(scratch.position)
    let nearest = Infinity
    let target: GhostPresence | undefined
    if (enabled && !reducedMotion) {
      for (const ghost of indoorGhosts) {
        const distance = ghost.position.distanceTo(scratch.position)
        if (ghost.opacity > 0.25 && distance < 7 && distance < nearest) {
          nearest = distance
          target = ghost
        }
      }
    }
    let yaw = 0,
      pitch = 0
    pet.parent.getWorldQuaternion(scratch.parentRotation)
    scratch.forward.set(0, 0, 1).applyQuaternion(scratch.parentRotation)
    if (target) {
      scratch.direction.subVectors(target.position, scratch.position)
      const angle =
        Math.atan2(scratch.direction.x, scratch.direction.z) -
        Math.atan2(scratch.forward.x, scratch.forward.z)
      const attention =
        target.opacity * (1 - MathUtils.smoothstep(nearest, 4.5, 7))
      yaw =
        MathUtils.clamp(
          Math.atan2(Math.sin(angle), Math.cos(angle)),
          -0.35,
          0.35
        ) * attention
      pitch =
        MathUtils.clamp(
          Math.atan2(
            scratch.direction.y,
            Math.hypot(scratch.direction.x, scratch.direction.z)
          ),
          -0.08,
          0.14
        ) * attention
    }
    scratch.yaw = MathUtils.damp(scratch.yaw, yaw, 2.5, delta)
    scratch.pitch = MathUtils.damp(scratch.pitch, pitch, 2.5, delta)
    head.parent.getWorldQuaternion(scratch.parentRotation).invert()
    scratch.axis.copy(UP).applyQuaternion(scratch.parentRotation)
    scratch.turn.setFromAxisAngle(scratch.axis, scratch.yaw)
    scratch.axis
      .copy(scratch.forward)
      .cross(UP)
      .normalize()
      .applyQuaternion(scratch.parentRotation)
    scratch.turn.premultiply(
      scratch.offset.setFromAxisAngle(scratch.axis, scratch.pitch)
    )
    pose.apply(scratch.turn)
    head.updateMatrixWorld(true)
  })
}
