import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test, { before } from "node:test"

import {
  Box3,
  type Object3D,
  ShaderMaterial,
  SkinnedMesh,
  Texture,
  Vector3
} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import { ASSETS_BASE } from "../../../lib/3d-config/asset-manifest"
import { createGhostRig } from "./rig"

let source: Object3D
before(async () => {
  const loader = new GLTFLoader()
  // Skinning tests don't need image decoding or a browser document.
  loader.register(() => ({
    name: "test-textures",
    loadTexture: async () => new Texture()
  }))
  const bytes = await readFile(
    `public${ASSETS_BASE.specialEvents.halloween.ghost}`
  )
  source = (await loader.parseAsync(Uint8Array.from(bytes).buffer, "")).scene
})

const createFixture = () => createGhostRig(source, [new ShaderMaterial()])

const rootOnly = (rig: ReturnType<typeof createFixture>, index: number) => {
  const joints = rig.mesh.geometry.getAttribute("skinIndex")
  const weights = rig.mesh.geometry.getAttribute("skinWeight")
  return [0, 1, 2, 3].every(
    (channel) =>
      weights.getComponent(index, channel) < 1e-6 ||
      joints.getComponent(index, channel) === 0
  )
}

test("instances preserve the authored pose, weights and cached GLB", () => {
  source.updateMatrixWorld(true)
  let original!: SkinnedMesh
  source.traverse((object) => {
    if (object instanceof SkinnedMesh) original = object
  })
  const inverses = original.skeleton.boneInverses.map((matrix) =>
    matrix.toArray()
  )
  const bounds = new Box3().setFromObject(source, true)
  const center = bounds.getCenter(new Vector3())
  const height = bounds.max.y - bounds.min.y
  const first = createFixture()
  const second = createFixture()
  assert.notEqual(first.mesh.skeleton.bones[0], second.mesh.skeleton.bones[0])
  assert.deepEqual(
    original.skeleton.boneInverses.map((matrix) => matrix.toArray()),
    inverses
  )
  assert.deepEqual(
    first.mesh.geometry.attributes.skinWeight.array,
    original.geometry.attributes.skinWeight.array
  )
  const authored = new Vector3()
  const actual = new Vector3()
  for (let i = 0; i < original.geometry.attributes.position.count; i++) {
    original.getVertexPosition(i, authored).applyMatrix4(original.matrixWorld)
    authored
      .sub(new Vector3(center.x, bounds.min.y, center.z))
      .divideScalar(height)
    for (const rig of [first, second]) {
      rig.mesh.getVertexPosition(i, actual)
      assert.ok(
        actual.distanceTo(authored) < 1e-5,
        "the normalized model must preserve its authored pose"
      )
    }
  }
  for (const rig of [first, second]) {
    rig.mesh.geometry.dispose()
    rig.mesh.skeleton.dispose()
    rig.materials.forEach((material) => material.dispose())
  }
})

test("a held ghost has more cloth follow-through while keeping its head rigid", (context) => {
  let clock = 1000
  context.mock.method(Date, "now", () => clock)
  const free = createFixture()
  const held = createFixture()
  const simulations = [free.start(), held.start()]
  const tips = held.mesh.skeleton.bones
    .filter((bone) => /^tassel.*_03$/.test(bone.name))
    .map((bone) => ({ bone, rest: bone.quaternion.clone(), flex: 0 }))
  const spineRest = free.mesh.skeleton.bones[2].quaternion.clone()
  let maxJointFlex = 0
  const rest = new Vector3()
  const point = new Vector3()
  const maxima = [0, 0]
  for (let frame = 0; frame < 120; frame++) {
    clock += 1000 / 60
    for (const [index, rig] of [free, held].entries()) {
      rig.object.position.x = Math.sin((frame / 60) * 12) * 0.5
      rig.object.updateMatrixWorld(true)
      simulations[index].update(1 / 60, index)
      rig.object.updateMatrixWorld(true)
      if (index === 1)
        tips.forEach((tip) => {
          tip.flex = Math.max(tip.flex, tip.bone.quaternion.angleTo(tip.rest))
        })
      if (index === 0)
        maxJointFlex = Math.max(
          maxJointFlex,
          rig.mesh.skeleton.bones[2].quaternion.angleTo(spineRest)
        )
      const vertices = rig.mesh.geometry.getAttribute("position")
      for (let i = 0; i < vertices.count; i++) {
        rest.fromBufferAttribute(vertices, i)
        rig.mesh.getVertexPosition(i, point)
        const displacement = point.distanceTo(rest)
        assert.ok(Number.isFinite(displacement) && displacement < 0.5)
        if (rootOnly(rig, i)) assert.ok(displacement < 1e-5)
        else maxima[index] = Math.max(maxima[index], displacement)
      }
    }
  }
  assert.ok(
    maxJointFlex > 0.04,
    "the lower spine must bend relative to the upper cloth instead of cancelling its rotation"
  )
  assert.ok(
    maxima[1] > maxima[0] * 1.15,
    "grabbing should make the cloth response more visible"
  )
  assert.equal(tips.length, 4, "all four cloth edges have a segmented chain")
  assert.ok(
    tips.every((tip) => tip.flex > 0.005),
    "every new tip must participate in the cloth follow-through"
  )
  for (const [index, rig] of [free, held].entries()) {
    simulations[index].dispose()
    rig.mesh.geometry.dispose()
    rig.materials.forEach((material) => material.dispose())
    rig.mesh.skeleton.dispose()
  }
})

for (const fps of [15, 30, 60, 120]) {
  test(`cloth keeps its head and silhouette through turns and a respawn at ${fps} FPS`, (context) => {
    // Wiggle's springs use wall-clock time internally, as on the Octocat.
    let clock = 1000
    context.mock.method(Date, "now", () => clock)
    const rig = createFixture()
    const simulation = rig.start()
    const rest = new Vector3()
    const deformed = new Vector3()
    const vertices = rig.mesh.geometry.getAttribute("position")
    let maxSkirtDisplacement = 0
    for (let frame = 0; frame < fps * 4; frame++) {
      clock += 1000 / fps
      const t = frame / fps
      // Includes a discontinuous route reset and a deliberate frame stall.
      rig.object.position.set(
        Math.sin(t * 2) * 1.5 + (t > 2 ? 40 : 0),
        2,
        Math.cos(t)
      )
      rig.object.rotation.y = Math.sin(t) * 0.8
      rig.object.updateMatrixWorld(true)
      simulation.update(frame === fps ? 0.5 : 1 / fps)
      rig.object.updateMatrixWorld(true)
      for (let i = 0; i < vertices.count; i++) {
        rest.fromBufferAttribute(vertices, i)
        rig.mesh.getVertexPosition(i, deformed)
        const displacement = deformed.distanceTo(rest)
        if (rest.y < 0.72)
          maxSkirtDisplacement = Math.max(maxSkirtDisplacement, displacement)
        assert.ok(Number.isFinite(displacement), "vertices must remain finite")
        assert.ok(
          displacement < 0.35,
          `skirt displacement ${displacement} at frame ${frame}, vertex ${i}`
        )
        if (rootOnly(rig, i))
          assert.ok(displacement < 1e-5, "the head must stay rigid")
      }
    }
    assert.ok(
      maxSkirtDisplacement > 0.01,
      "movement must actually produce secondary cloth motion"
    )
    simulation.dispose()
    assert.equal(
      rig.object.children.length,
      2,
      "wiggle drivers must be removed on cleanup"
    )
    rig.object.updateMatrixWorld(true)
    for (let i = 0; i < vertices.count; i++) {
      rest.fromBufferAttribute(vertices, i)
      rig.mesh.getVertexPosition(i, deformed)
      assert.ok(
        deformed.distanceTo(rest) < 1e-5,
        "cleanup restores the rest pose"
      )
    }
    rig.mesh.geometry.dispose()
    rig.materials.forEach((material) => material.dispose())
    rig.mesh.skeleton.dispose()
  })
}
