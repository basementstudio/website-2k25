import assert from "node:assert/strict"
import test from "node:test"

import { ShaderMaterial, Vector3 } from "three"

import { createCatInteraction, updateCatInteraction } from "./interaction"
import { createCatRig } from "./rig"

test("a hover gets one short swat, with a cooldown and a fresh entry required", () => {
  const state = createCatInteraction()
  updateCatInteraction(state, 0, 1 / 60, 0, 0, true, -1, false)
  updateCatInteraction(state, 0.2, 1 / 60, 0, 0, true, -1, false)
  assert.ok(state.swipe > 0 && state.swipe < 1)
  assert.equal(state.swipeSide, -1)
  for (let frame = 1; frame <= 600; frame++)
    updateCatInteraction(state, frame / 60, 1 / 60, 0, 0, true, 1, false)
  assert.equal(
    state.swipeStartedAt,
    0,
    "holding the mouse must not retrigger the swat"
  )
  assert.equal(state.swipe, 0)
  updateCatInteraction(state, 10.1, 1 / 60, 0, 0, false, 1, false)
  updateCatInteraction(state, 10.2, 1 / 60, 0, 0, true, 1, false)
  assert.equal(state.swipeStartedAt, 10.2)
  assert.equal(state.swipeSide, 1)
  updateCatInteraction(state, 10.3, 1 / 60, 0, 0, false, 1, false)
  updateCatInteraction(state, 10.4, 1 / 60, 0, 0, true, 1, false)
  assert.equal(
    state.swipeStartedAt,
    10.2,
    "rapid re-entry respects the cooldown"
  )
})

test("gaze stays bounded, blinks reopen, and reduced motion avoids head and paw movement", () => {
  const state = createCatInteraction()
  for (let frame = 0; frame < 120; frame++)
    updateCatInteraction(state, frame / 60, 1 / 60, 4, -4, false, 1, false)
  assert.ok(state.yaw <= 0.48 && state.pitch >= -0.22)
  updateCatInteraction(state, 3.5, 1 / 60, 0, 0, false, 1, false)
  updateCatInteraction(state, 3.6, 1 / 60, 0, 0, false, 1, false)
  assert.ok(state.blink > 0.99)
  updateCatInteraction(state, 3.75, 1 / 60, 0, 0, false, 1, false)
  assert.equal(state.blink, 0)
  const reduced = createCatInteraction()
  updateCatInteraction(reduced, 1, 1 / 60, 4, -4, true, 1, true)
  assert.equal(reduced.yaw, 0)
  assert.equal(reduced.pitch, 0)
  assert.equal(reduced.swipe, 0)
})

test("the seated cat stays on its speaker while its head, eyes and paw react", () => {
  const materials = Array.from({ length: 4 }, () => new ShaderMaterial())
  const rig = createCatRig(
    materials[0],
    materials[1],
    materials[2],
    materials[3]
  )
  const position = new Vector3(9.472, 3.721, -14.402)
  rig.object.position.copy(position)
  rig.object.rotation.y = -0.44
  for (let frame = 0; frame <= 60; frame++) {
    rig.update(0.4, -0.2, frame === 30 ? 1 : 0, frame / 60, -1)
    assert.ok(rig.object.position.equals(position))
    assert.equal(rig.object.rotation.y, -0.44)
  }
  rig.update(0, 0, 0, 0, 1)
  assert.ok(
    Math.abs(rig.object.getObjectByName("cat-paw-left")!.rotation.x) < 1e-6
  )
  assert.ok(
    rig.object
      .getObjectsByProperty("name", "cat-eye")
      .every((eye) => eye.scale.y === 1)
  )
  assert.ok(
    rig.object
      .getObjectsByProperty("name", "cat-claws")
      .every((claws) => !claws.visible)
  )
  rig.dispose()
  materials.forEach((material) => material.dispose())
})
