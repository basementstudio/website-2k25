import {
  Bone,
  Float32BufferAttribute,
  LatheGeometry,
  ShaderMaterial,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute
} from "three"
import { WiggleBone } from "wiggle/spring"

const JOINT_HEIGHTS = [0.72, 0.48, 0.24, 0]

// The head carries the sheet; the rest follows its movement with inertia,
// using the same spring bones as the Octocat inspectable.
export const createGhostRig = (
  geometry: LatheGeometry,
  materials: ShaderMaterial[]
) => {
  const bones = JOINT_HEIGHTS.map(() => new Bone())
  bones[0].position.y = JOINT_HEIGHTS[0]
  // Wiggle derives rotations from +Y. Point the rigid root down so every
  // flexible joint keeps an identity rest rotation and a positive length.
  bones[0].rotation.z = Math.PI
  for (let i = 1; i < bones.length; i++) {
    bones[i].position.y = JOINT_HEIGHTS[i - 1] - JOINT_HEIGHTS[i]
    bones[i - 1].add(bones[i])
  }

  const vertices = geometry.getAttribute("position")
  const indices = new Uint16Array(vertices.count * 4)
  const weights = new Float32Array(vertices.count * 4)
  for (let i = 0; i < vertices.count; i++) {
    const y = Math.max(0, Math.min(JOINT_HEIGHTS[0], vertices.getY(i)))
    let joint = 0
    while (joint < bones.length - 2 && y < JOINT_HEIGHTS[joint + 1]) joint++
    const blend =
      (JOINT_HEIGHTS[joint] - y) /
      (JOINT_HEIGHTS[joint] - JOINT_HEIGHTS[joint + 1])
    indices[i * 4] = joint
    indices[i * 4 + 1] = joint + 1
    weights[i * 4] = 1 - blend
    weights[i * 4 + 1] = blend
  }
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute(indices, 4))
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4))
  // Draw the inside first, then the outside, sharing exactly one skeleton.
  geometry.clearGroups()
  materials.forEach((_, i) => geometry.addGroup(0, geometry.index!.count, i))
  const mesh = new SkinnedMesh(geometry, materials)
  mesh.add(bones[0])
  mesh.frustumCulled = false
  mesh.raycast = () => {}
  mesh.updateMatrixWorld(true)
  mesh.bind(new Skeleton(bones))

  return {
    mesh,
    start: () => {
      const springs = bones.slice(1).map(
        (bone, i) =>
          new WiggleBone(bone, {
            stiffness: 360 - i * 40,
            damping: 30 - i * 2
          })
      )
      return {
        update: (delta: number) => {
          if (delta <= 0) return
          springs.forEach((spring) => spring.update(delta))
        },
        dispose: () => {
          // Restore children before removing their parents' wrappers.
          springs.toReversed().forEach((spring) => spring.dispose())
        }
      }
    }
  }
}
