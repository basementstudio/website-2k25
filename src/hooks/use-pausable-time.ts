import { type RootState, useFrame } from "@react-three/fiber"
import { useCallback, useEffect, useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"

/**
 * Maximum delta time to prevent physics issues on frame drops
 * Limits calculations to simulate at most 1/15th of a second per frame
 */
const MAX_DELTA = 1 / 15

/**
 * Configuration for global time management
 */
export const globalFrameConfig = {
  isPaused: false,
  elapsedTime: 0,
  delta: 0,

  /**
   * Resets the global elapsed time to zero
   */
  reset: () => {
    globalFrameConfig.elapsedTime = 0
  }
}

/**
 * Updates the global frame timing configuration
 * This should be called once in your root component
 *
 * @param options Optional configuration for custom pause conditions
 */
export const useGlobalFrameLoop = (options?: {
  shouldPause?: () => boolean
}) => {
  const { isContactOpen } = useContactStore()

  // Update pause state based on contact or custom condition
  useEffect(() => {
    globalFrameConfig.isPaused = options?.shouldPause?.() ?? isContactOpen
  }, [isContactOpen, options])

  // Update timing values with high priority (-100)
  useFrame((_, delta) => {
    // Re-check pause state with latest values
    globalFrameConfig.isPaused =
      options?.shouldPause?.() ?? useContactStore.getState().isContactOpen

    if (!globalFrameConfig.isPaused) {
      globalFrameConfig.elapsedTime += delta
      globalFrameConfig.delta = Math.min(delta, MAX_DELTA)
    }
  }, -100)
}

/**
 * Legacy support - returns a ref with pausable time
 *
 * @param options Optional configuration for custom pause conditions
 */
export const usePausableTimeRef = (options?: {
  shouldPause?: () => boolean
}) => {
  const { isContactOpen } = useContactStore()
  const pausableTimeRef = useRef(0)
  const lastTimeRef = useRef(0)

  // Reset function
  const reset = useCallback(() => {
    pausableTimeRef.current = 0
  }, [])

  useFrame(({ clock }) => {
    // Determine if we should pause based on contact or custom condition
    const shouldPause = options?.shouldPause?.() ?? isContactOpen

    // For accumulated time - only increment when not paused
    if (!shouldPause) {
      const timeDelta = clock.getElapsedTime() - lastTimeRef.current
      pausableTimeRef.current += timeDelta
    }

    // Always update the last recorded time
    lastTimeRef.current = clock.getElapsedTime()
  })

  return { timeRef: pausableTimeRef, reset }
}

/**
 * Hook for components that need to run frame updates with proper pausing
 *
 * @param callback Function to execute each frame with proper delta timing
 * @param priority Optional priority for the frame callback
 * @param options Optional configuration for custom pause conditions and behaviors
 */
export const useFrameCallback = (
  callback: (state: RootState, delta: number, elapsedTime: number) => void,
  priority?: number,
  options?: {
    shouldPause?: () => boolean
    initialTime?: number
  }
) => {
  const pausableTimeRef = useRef(options?.initialTime ?? 0)
  const lastTimeRef = useRef(0)

  // Reset function
  const reset = useCallback(() => {
    pausableTimeRef.current = options?.initialTime ?? 0
  }, [options?.initialTime])

  useFrame((state, delta) => {
    // Determine if we should pause based on contact or custom condition
    const shouldPause =
      options?.shouldPause?.() ?? useContactStore.getState().isContactOpen

    // Skip callback execution when paused
    if (shouldPause) return

    // Update pausable time
    const currentTime = state.clock.getElapsedTime()
    const timeDelta = currentTime - lastTimeRef.current
    pausableTimeRef.current += timeDelta
    lastTimeRef.current = currentTime

    // Apply delta clamping to prevent physics issues
    const clampedDelta = Math.min(delta, MAX_DELTA)

    // Execute callback with proper timing values
    callback(state, clampedDelta, pausableTimeRef.current)
  }, priority)

  return { reset, currentTime: pausableTimeRef }
}
