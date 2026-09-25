import { type RootState, useFrame } from "@react-three/fiber"
import { useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"

/**
 * Maximum delta time to prevent physics issues on frame drops
 * Limits calculations to simulate at most 1/15th of a second per frame
 */
const MAX_DELTA = 1 / 15

/**
 * Hook for components that need to run frame updates with proper pausing
 *
 * @param callback Function to execute each frame with proper delta timing
 * @param priority Optional priority for the frame callback
 */
export const useFrameCallback = (
  callback: (state: RootState, delta: number, elapsedTime: number) => void,
  priority?: number
) => {
  const time = useRef(0)
  const delta = useRef(0)
  const lastTime = useRef(0)

  useFrame((state, rawDelta) => {
    if (state.gl.getContext().isContextLost()) return

    const elapsed = state.clock.getElapsedTime()
    const { isContactOpen } = useContactStore.getState()

    if (isContactOpen) {
      delta.current = 0
      lastTime.current = elapsed
      return
    }

    time.current += elapsed - lastTime.current
    lastTime.current = elapsed
    delta.current = Math.min(rawDelta, MAX_DELTA)

    callback(state, delta.current, time.current)
  }, priority)
}
