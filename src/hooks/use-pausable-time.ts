import { type RootState, useFrame } from "@react-three/fiber"
import { useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"

/**
 * Maximum delta time to prevent physics issues on frame drops
 * Limits calculations to simulate at most 1/15th of a second per frame
 */
const MAX_DELTA = 1 / 15

// Shared configuration across the application
// Use only if you need exactly the same timing values everywhere
export const globalFrameConfig = {
  isPaused: false,
  elapsedTime: 0,
  delta: 0
}

/**
 * Updates the global frame timing configuration
 * This should be called once in your root component
 */
export const useGlobalFrameLoop = () => {
  const { isContactOpen } = useContactStore()

  // Update pause state based on contact
  globalFrameConfig.isPaused = isContactOpen

  // Update timing values with high priority (-100)
  useFrame((_, delta) => {
    if (!globalFrameConfig.isPaused) {
      globalFrameConfig.elapsedTime += delta
      globalFrameConfig.delta = Math.min(delta, MAX_DELTA)
    }
  }, -100)
}

/**
 * Hook that provides pausable time and delta values
 * Local version that creates independent timing for each component
 *
 * @returns An object with time and delta references
 */
const usePausableTime = () => {
  const { isContactOpen } = useContactStore()
  const pausableTimeRef = useRef(0)
  const pausableDeltaRef = useRef(0)
  const lastTimeRef = useRef(0)

  useFrame(({ clock }, delta) => {
    // For accumulated time - only increment when not paused
    if (!isContactOpen) {
      const timeDelta = clock.getElapsedTime() - lastTimeRef.current
      pausableTimeRef.current += timeDelta

      // For delta - use the actual delta when not paused, but clamped to prevent physics issues
      pausableDeltaRef.current = Math.min(delta, MAX_DELTA)
    } else {
      // When paused, delta becomes zero
      pausableDeltaRef.current = 0
    }

    // Always update the last recorded time
    lastTimeRef.current = clock.getElapsedTime()
  })

  return {
    time: pausableTimeRef,
    delta: pausableDeltaRef
  }
}

/**
 * Hook for components that need to run frame updates with proper pausing
 * Uses the locally managed time rather than global time
 *
 * @param callback Function to execute each frame with proper delta timing
 * @param priority Optional priority for the frame callback
 */
export const useFrameCallback = (
  callback: (state: RootState, delta: number, elapsedTime: number) => void,
  priority?: number
) => {
  const { time, delta } = usePausableTime()

  useFrame((state) => {
    const { isContactOpen } = useContactStore.getState()
    if (isContactOpen) return

    callback(state, delta.current, time.current)
  }, priority)
}
