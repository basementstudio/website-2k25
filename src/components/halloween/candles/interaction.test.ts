import assert from "node:assert/strict"
import test from "node:test"

import { createCandleState, updateCandle } from "./interaction"

for (const fps of [15, 60, 120]) {
  test(`a candle blows out once per hover and relights on its own at ${fps} FPS`, () => {
    const candle = createCandleState(0.4)
    const neighbour = createCandleState(0.7)
    let bend = 0
    for (let frame = 0; frame < fps; frame++) {
      updateCandle(candle, true, -1, frame / fps, 1 / fps, false)
      updateCandle(neighbour, false, -1, frame / fps, 1 / fps, false)
      bend = Math.min(bend, candle.bend)
    }
    assert.ok(candle.light < 0.01)
    assert.ok(bend < -0.1)
    assert.equal(neighbour.light, 1)
    const deadline = candle.outUntil
    for (let frame = fps; frame < fps * 8; frame++)
      updateCandle(candle, true, 1, frame / fps, 1 / fps, false)
    assert.ok(
      candle.light > 0.99,
      "it must relight even if the cursor stays put"
    )
    assert.equal(
      candle.outUntil,
      deadline,
      "a stationary cursor must not repeatedly blow it out"
    )
    updateCandle(candle, false, 0, 8, 1 / fps, false)
    for (let frame = 1; frame < fps; frame++)
      updateCandle(candle, true, 1, 8 + frame / fps, 1 / fps, false)
    assert.ok(candle.light < 0.01, "a fresh hover can extinguish it again")
  })
}

test("reduced motion keeps extinguishing and relighting without bending", () => {
  const candle = createCandleState(0)
  for (let frame = 0; frame < 60; frame++)
    updateCandle(candle, true, 1, frame / 60, 1 / 60, true)
  assert.ok(candle.light < 0.01)
  assert.equal(candle.bend, 0)
  for (let frame = 60; frame < 360; frame++)
    updateCandle(candle, false, 0, frame / 60, 1 / 60, true)
  assert.ok(candle.light > 0.99)
})
