import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"

import { flightKeys, useAirplaneStore } from "./store"

beforeEach(() => {
  useAirplaneStore.setState(useAirplaneStore.getInitialState(), true)
  flightKeys.clear()
})

test("cancelling a loading inspectable flight does not auto-launch the next entry", () => {
  useAirplaneStore.getState().enterMode("free")
  flightKeys.add("ArrowUp")
  useAirplaneStore.getState().exit()
  assert.equal(useAirplaneStore.getState().autoLaunchMode, null)
  assert.equal(flightKeys.size, 0)
  useAirplaneStore.getState().enter()
  assert.equal(useAirplaneStore.getState().phase, "loading")
  assert.equal(useAirplaneStore.getState().autoLaunchMode, null)
})

test("normal entry and retry clear a pending inspectable auto-launch", () => {
  for (const action of ["enter", "restart"] as const) {
    useAirplaneStore.getState().enterMode("free")
    useAirplaneStore.setState({ phase: "error" })
    useAirplaneStore.getState()[action]()
    assert.equal(useAirplaneStore.getState().autoLaunchMode, null)
  }
})

test("a fresh inspectable flight retains its launch mode until it launches", () => {
  useAirplaneStore.getState().enterMode("free")
  assert.equal(useAirplaneStore.getState().autoLaunchMode, "free")
  useAirplaneStore.getState().launch("free")
  assert.equal(useAirplaneStore.getState().phase, "flying")
  assert.equal(useAirplaneStore.getState().mode, "free")
  assert.equal(useAirplaneStore.getState().autoLaunchMode, null)
})
