import assert from "node:assert/strict"
import test from "node:test"

import { Vector3 } from "three"

import { createRoomPath, createRoomSchedule } from "./paths"

test("routes cover the floor and balcony without visible teleports", () => {
  const path = createRoomPath(0.13)
  const previous = new Vector3()
  const position = new Vector3()
  let previousPresence = 0
  let approaches = false,
    retreats = false,
    behindCamera = false,
    upstairs = false,
    waiting = false
  for (let frame = 0; frame < 1200 * 60; frame++) {
    const presence = path(frame / 60, position)
    assert.ok(
      Number.isFinite(position.length()) && presence >= 0 && presence <= 1
    )
    assert.ok(position.x >= 2.2 && position.x <= 12.9)
    assert.ok(position.y >= 0.11 && position.y <= 5.5)
    assert.ok(position.z >= -19.1 && position.z <= -6)
    if (position.z < -14.7 && position.y < 1)
      assert.ok(
        position.x > 6.3 && position.x < 6.7,
        "use the corridor opening downstairs"
      )
    if (presence > 0 && previousPresence > 0) {
      assert.ok(
        position.distanceTo(previous) < 0.04,
        "never teleport while visible"
      )
      if (presence > 0.5) {
        approaches ||= position.z - previous.z > 0.001
        retreats ||= position.z - previous.z < -0.001
        upstairs ||= position.y > 3.7
      }
    }
    behindCamera ||= presence > 0 && position.z > -7.57
    waiting ||= presence === 0
    previous.copy(position)
    previousPresence = presence
  }
  assert.ok(approaches && retreats && behindCamera && upstairs && waiting)
})

test("shuffled routes vary direction and timing without consecutive repeats", () => {
  const schedule = createRoomSchedule(0.13)
  const episodes = [schedule.at(0)]
  for (let i = 1; i < 30; i++)
    episodes.push(schedule.at(episodes[i - 1].end + 0.001))
  assert.equal(new Set(episodes.slice(0, 5).map((e) => e.index)).size, 5)
  for (let i = 1; i < episodes.length; i++)
    assert.notEqual(episodes[i].index, episodes[i - 1].index)
  assert.ok(
    episodes.some((e) => e.reversed) && episodes.some((e) => !e.reversed)
  )
  const waits = episodes.map((e) => e.end - e.start - e.duration)
  assert.ok(waits.every((wait) => wait >= 6 && wait <= 16))
  assert.ok(new Set(waits.map((wait) => wait.toFixed(2))).size > 10)
})

test("look-ahead and out-of-order sampling do not change a route", () => {
  const sequential = createRoomPath(0.13)
  const jumped = createRoomPath(0.13)
  const actual = new Vector3()
  const expected = new Vector3()
  jumped(1000, actual)
  for (let t = 0; t < 500; t += 0.37) {
    const presence = sequential(t, expected)
    sequential(t + 0.1, actual)
    assert.equal(jumped(t, actual), presence)
    assert.ok(actual.distanceTo(expected) < 1e-10)
    sequential(t, actual)
    assert.ok(actual.distanceTo(expected) < 1e-10)
  }
})
