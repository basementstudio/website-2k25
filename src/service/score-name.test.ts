import assert from "node:assert/strict"
import { test } from "node:test"

import { isBlockedScoreName } from "./score-name"

test("blocks basketball exclusions and dictionary matches regardless of case", () => {
  for (const name of ["GAY", "gay", "GaY", "DIK", "dik", "DiK", "ASS", "SEX"]) {
    assert.equal(isBlockedScoreName(name), true, name)
  }
})

test("allows ordinary initials, numbers, and legacy symbols", () => {
  for (const name of ["AAA", "NIC", "JON", "ABC", "A1B", "222", "!!!", ""]) {
    assert.equal(isBlockedScoreName(name), false, name)
  }
})
