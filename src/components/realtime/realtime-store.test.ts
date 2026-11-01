import assert from "node:assert/strict"
import { test } from "node:test"

test("realtime store tolerates blocked localStorage", async () => {
  const g = globalThis as Record<string, unknown>
  const blocked = () => {
    throw new Error(
      "SecurityError: Failed to read the 'localStorage' property from 'Window'"
    )
  }
  g.window = g
  Object.defineProperty(g, "localStorage", { get: blocked, configurable: true })

  try {
    const { useRealtimeStore } = await import("./realtime-store")
    assert.equal(useRealtimeStore.getState().displayName, "")
    assert.doesNotThrow(() => useRealtimeStore.getState().setDisplayName("bob"))
    assert.equal(useRealtimeStore.getState().displayName, "bob")
  } finally {
    delete g.localStorage
    delete g.window
  }
})
