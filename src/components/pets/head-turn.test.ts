import assert from "node:assert/strict"
import test from "node:test"

import {
  AnimationClip,
  AnimationMixer,
  Bone,
  Group,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3
} from "three"

import { createHeadTurn } from "./head-turn"

test("attention never accumulates when the animation mixer skips a constant track", () => {
  const root = new Group()
  const head = new Bone()
  head.name = "head"
  root.add(head)
  const mixer = new AnimationMixer(root)
  const clip = new AnimationClip("idle", 1, [
    new QuaternionKeyframeTrack(
      "head.quaternion",
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1]
    )
  ])
  mixer.clipAction(clip).play()
  const pose = createHeadTurn(head)
  const offset = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.3)
  for (let frame = 0; frame < 600; frame++) {
    pose.restore()
    mixer.update(1 / 60)
    pose.apply(offset)
    assert.ok(
      head.quaternion.angleTo(offset) < 1e-6,
      "keep the same bounded turn even on constant animation frames"
    )
  }
  pose.restore()
  assert.ok(
    head.quaternion.angleTo(new Quaternion()) < 1e-6,
    "restore the animation pose when attention stops"
  )
  mixer.stopAllAction()
  mixer.uncacheRoot(root)
})
