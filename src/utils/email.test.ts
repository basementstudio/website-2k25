import assert from "node:assert/strict"
import { test } from "node:test"

import { EMAIL_REGEX, isValidEmail } from "./email"

test("accepts well-formed email addresses", () => {
  for (const email of ["jane@example.com", "jane.doe+news@sub.example.co"]) {
    assert.equal(isValidEmail(email), true, email)
  }
})

test("rejects malformed email addresses", () => {
  for (const email of [
    "",
    "jane",
    "a@b",
    "user@localhost",
    "jane@example.",
    "jane doe@example.com",
    "@example.com",
    "jane@.example.com",
    "jane@example..com"
  ]) {
    assert.equal(isValidEmail(email), false, email)
  }
})

test("rejects oversized addresses", () => {
  assert.equal(isValidEmail(`${"a".repeat(250)}@example.com`), false)
})

test("matches crafted backtracking input in linear time", () => {
  const crafted = `a@${".".repeat(128_000)}@`

  const start = performance.now()
  assert.equal(isValidEmail(crafted), false)
  // Run the pattern directly too, bypassing the length cap.
  assert.equal(EMAIL_REGEX.test(crafted), false)
  assert.ok(performance.now() - start < 100)
})
