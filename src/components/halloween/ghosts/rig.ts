import {
  Bone,
  Box3,
  Group,
  Matrix4,
  type MeshStandardMaterial,
  type Object3D,
  Quaternion,
  type ShaderMaterial,
  SkinnedMesh,
  Vector3
} from "three"
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js"
import { WiggleBone } from "wiggle/spring"

const IDENTITY = new Quaternion()

export const createGhostRig = (
  source: Object3D,
  materials: ShaderMaterial[]
) => {
  // SkeletonUtils gives each ghost its own bones. Geometry is cloned before
  // normalizing, while the embedded alpha texture stays in the loader cache.
  const armature = clone(source)
  armature.updateMatrixWorld(true)
  let mesh: SkinnedMesh | undefined
  armature.traverse((object) => {
    if (object instanceof SkinnedMesh) mesh = object
  })
  if (!mesh) throw new Error("The Halloween ghost GLB has no skinned mesh")
  const body = mesh
  // Skeleton.clone shares the inverse array; rebinding one instance must
  // never change the cached GLB or the other ghosts.
  body.skeleton.boneInverses = body.skeleton.boneInverses.map((matrix) =>
    matrix.clone()
  )
  const originalMaterial = (
    Array.isArray(body.material) ? body.material[0] : body.material
  ) as MeshStandardMaterial
  const bounds = new Box3().setFromObject(armature, true)
  const center = bounds.getCenter(new Vector3())
  const height = bounds.max.y - bounds.min.y
  const normalization = new Matrix4().makeScale(
    1 / height,
    1 / height,
    1 / height
  )
  normalization.setPosition(
    -center.x / height,
    -bounds.min.y / height,
    -center.z / height
  )
  const geometry = body.geometry.clone()
  geometry.applyMatrix4(
    new Matrix4().multiplyMatrices(normalization, body.matrixWorld)
  )
  const point = new Vector3()
  const vertices = geometry.getAttribute("position")
  for (let i = 0; i < vertices.count; i++) {
    body
      .getVertexPosition(i, point)
      .applyMatrix4(body.matrixWorld)
      .applyMatrix4(normalization)
    vertices.setXYZ(i, point.x, point.y, point.z)
  }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  geometry.clearGroups()
  materials.forEach((_, i) => geometry.addGroup(0, geometry.index!.count, i))
  body.parent?.remove(body)
  armature.applyMatrix4(normalization)
  body.position.set(0, 0, 0)
  body.quaternion.identity()
  body.scale.setScalar(1)
  body.geometry = geometry
  body.material = materials
  body.frustumCulled = false
  body.raycast = () => {}
  const object = new Group()
  object.name = "authored-halloween-ghost"
  object.add(armature, body)
  object.updateMatrixWorld(true)
  // Rebind once in normalized model space. Bone names, parentage, local
  // rest rotations and every authored skin weight remain untouched.
  body.skeleton.calculateInverses()
  body.bind(body.skeleton, new Matrix4())
  materials.forEach((material) => {
    if (material.uniforms.uClothMap)
      material.uniforms.uClothMap.value = originalMaterial.map
  })

  const levels = new Float32Array(33)
  for (let i = 0; i < vertices.count; i++) {
    const row = Math.max(0, Math.min(32, Math.round(vertices.getY(i) * 32)))
    levels[row] = Math.max(levels[row], Math.abs(vertices.getX(i)))
  }
  for (let i = 0; i < levels.length; i++) {
    if (levels[i] > 0) continue
    let below = i - 1,
      above = i + 1
    while (below >= 0 && levels[below] === 0) below--
    while (above < levels.length && levels[above] === 0) above++
    levels[i] = Math.max(
      levels[Math.max(0, below)],
      levels[Math.min(32, above)]
    )
  }
  const bones = body.skeleton.bones
    .filter((bone) => /^spine\d+|^tassel/.test(bone.name))
    .map((bone) => ({
      bone,
      rest: bone.quaternion.clone(),
      tassel: bone.name.startsWith("tassel")
    }))

  return {
    object,
    mesh: body,
    materials,
    radiusAt: (y: number) => {
      const row = Math.max(0, Math.min(32, y * 32))
      const i = Math.floor(row)
      return levels[i] + (levels[Math.min(32, i + 1)] - levels[i]) * (row - i)
    },
    start: () => {
      const drivers = bones.map(({ bone, rest, tassel }, i) => {
        const frame = new Group()
        frame.position.copy(bone.position)
        frame.quaternion.copy(rest)
        const driver = new Bone()
        driver.position.y = tassel ? 0.5 : 0.65
        frame.add(driver)
        bone.parent!.add(frame)
        object.updateMatrixWorld(true)
        return {
          frame,
          driver,
          rotation: new Quaternion(),
          spring: new WiggleBone(driver, {
            stiffness:
              bone.userData.wiggleStiffness ?? (tassel ? 180 : 620 - i * 180),
            damping: bone.userData.wiggleDamping ?? (tassel ? 19 : 31 - i * 5)
          })
        }
      })
      const previous = new Vector3()
      const current = new Vector3()
      const deltaRotation = new Quaternion()
      let initialized = false
      return {
        update: (delta: number, grab = 0) => {
          if (delta <= 0) return
          object.getWorldPosition(current)
          if (
            !initialized ||
            current.distanceToSquared(previous) > 4 ||
            delta > 0.25
          ) {
            drivers.forEach(({ spring, rotation }) => {
              spring.reset()
              rotation.identity()
            })
            initialized = true
          }
          previous.copy(current)
          drivers.forEach(({ driver, spring, rotation }, i) => {
            spring.update(Math.min(delta, 1 / 15))
            deltaRotation.copy(driver.quaternion)
            const angle = 2 * Math.acos(Math.min(1, Math.abs(deltaRotation.w)))
            const maxBend =
              (bones[i].tassel ? 0.2 : 0.06 + i * 0.04) +
              Math.min(1, Math.max(0, grab)) * 0.08
            if (angle > maxBend)
              deltaRotation.slerp(IDENTITY, 1 - maxBend / angle)
            // Ease changes in bend so a quick tug or direction reversal
            // rolls through the sheet instead of snapping at the limit.
            rotation.slerp(
              deltaRotation,
              1 -
                Math.exp(-(bones[i].tassel ? 7 : 10) * Math.min(delta, 1 / 15))
            )
            // Local bends accumulate down the actual skeleton. Anchoring
            // each driver to its parent lets the lower cloth lag behind
            // the moving upper cloth, instead of cancelling its rotation.
            bones[i].bone.quaternion.copy(bones[i].rest).multiply(rotation)
            bones[i].bone.updateMatrixWorld(true)
          })
        },
        dispose: () => {
          drivers.toReversed().forEach(({ frame, spring }) => {
            spring.dispose()
            frame.removeFromParent()
          })
          bones.forEach(({ bone, rest }) => bone.quaternion.copy(rest))
        }
      }
    }
  }
}
