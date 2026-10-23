import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isPhysicsPoisoned,
  markPhysicsPoisoned,
  resetPhysicsPoisonedForTests,
  safeRapier
} from "./rapier-guard"

test("returns the callback result while physics is healthy", () => {
  resetPhysicsPoisonedForTests()
  assert.equal(
    safeRapier("t", () => 42, -1),
    42
  )
  assert.equal(isPhysicsPoisoned(), false)
})

test("a throwing call poisons physics and returns the fallback", () => {
  resetPhysicsPoisonedForTests()
  const result = safeRapier(
    "t",
    () => {
      throw new Error("recursive use of an object detected")
    },
    "fallback"
  )
  assert.equal(result, "fallback")
  assert.equal(isPhysicsPoisoned(), true)
})

test("once poisoned, later calls are skipped entirely", () => {
  resetPhysicsPoisonedForTests()
  markPhysicsPoisoned(new Error("boom"), "t")
  let called = false
  const result = safeRapier(
    "t",
    () => {
      called = true
      return 1
    },
    0
  )
  assert.equal(called, false)
  assert.equal(result, 0)
})
