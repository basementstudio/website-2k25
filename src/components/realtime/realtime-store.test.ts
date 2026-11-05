import assert from "node:assert/strict"
import { test } from "node:test"

test("store survives a null localStorage (Safari with storage blocked)", async () => {
  const g = globalThis as Record<string, unknown>
  g.window = globalThis
  Object.defineProperty(globalThis, "localStorage", {
    value: null,
    configurable: true,
    writable: true
  })

  const { useRealtimeStore } = await import("./realtime-store")

  assert.equal(useRealtimeStore.getState().displayName, "")

  assert.doesNotThrow(() =>
    useRealtimeStore.getState().setDisplayName("  bob ")
  )
  assert.equal(useRealtimeStore.getState().displayName, "bob")
})
