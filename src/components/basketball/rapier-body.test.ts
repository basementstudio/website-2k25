import assert from "node:assert/strict"
import { test } from "node:test"

import { getLiveBody } from "./rapier-body"

const fakeBody = (valid: boolean) => {
  let calls = 0
  return {
    body: {
      isValid: () => {
        calls++
        return valid
      }
    },
    calls: () => calls
  }
}

test("returns null when the ref is empty", () => {
  assert.equal(getLiveBody({ current: null }), null)
  assert.equal(getLiveBody({ current: undefined }), null)
})

test("returns null when the rapier handle has been freed", () => {
  const { body, calls } = fakeBody(false)
  assert.equal(getLiveBody({ current: body }), null)
  assert.equal(calls(), 1)
})

test("returns the body when the rapier handle is alive", () => {
  const { body } = fakeBody(true)
  assert.equal(getLiveBody({ current: body }), body)
})
