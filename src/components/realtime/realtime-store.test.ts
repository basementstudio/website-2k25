import assert from "node:assert/strict"
import { test } from "node:test"

test("store loads and setDisplayName works when localStorage is blocked", async () => {
  const blocked = () => {
    throw new DOMException("The operation is insecure.", "SecurityError")
  }
  const g = globalThis as Record<string, unknown>
  g.window = globalThis
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: blocked
  })

  try {
    const { useRealtimeStore } = await import("./realtime-store")
    assert.equal(useRealtimeStore.getState().displayName, "")

    useRealtimeStore.getState().setDisplayName("  Ada  ")
    assert.equal(useRealtimeStore.getState().displayName, "Ada")
  } finally {
    delete g.localStorage
    delete g.window
  }
})
