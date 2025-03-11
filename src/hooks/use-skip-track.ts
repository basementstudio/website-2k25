import { useCallback, useRef } from "react"

/**
 * Hook that provides a function to safely skip to the next track.
 * Includes debouncing to prevent rapid consecutive skips.
 */
export function useSkipTrack() {
  const isSkippingRef = useRef(false)

  const skipToNextTrack = useCallback(() => {
    // prevent multiple rapid skips
    if (isSkippingRef.current) {
      return
    }

    isSkippingRef.current = true

    const ambience = window.__WEBSITE_AMBIENCE__?.advanceToNextTrack

    if (ambience) {
      ambience()
    } else {
      console.warn("Ambience player not initialized")
    }

    setTimeout(() => {
      isSkippingRef.current = false
    }, 300)
  }, [])

  return skipToNextTrack
}
