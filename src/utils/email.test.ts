import assert from "node:assert/strict"
import { test } from "node:test"

import { isValidEmail } from "./email"

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
    "@example.com"
  ]) {
    assert.equal(isValidEmail(email), false, email)
  }
})
