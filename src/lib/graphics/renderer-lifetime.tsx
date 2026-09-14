import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import type { WebGPURenderer } from "three/webgpu"

const pending = new WeakMap<WebGPURenderer, object>()

/** Fiber tears down its root but does not call WebGPURenderer.dispose(). */
export function RendererLifetime() {
  const renderer = useThree((state) => state.gl) as unknown as WebGPURenderer
  useEffect(() => {
    // Strict Mode replays effects on the same live renderer. Cancel that replay's
    // pending disposal; a real unmount has no subsequent owner setup.
    pending.delete(renderer)
    return () => {
      const token = {}
      pending.set(renderer, token)
      queueMicrotask(() => {
        if (pending.get(renderer) !== token) return
        pending.delete(renderer)
        renderer.dispose()
      })
    }
  }, [renderer])
  return null
}
