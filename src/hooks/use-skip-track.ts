import { useCallback, useRef } from "react"

import { useSiteAudioStore } from "./use-site-audio"

/**
 * Hook that provides a function to safely skip to the next track.
 * Ensures only one track plays at a time with no delays.
 */
export function useSkipTrack() {
  const isSkippingRef = useRef(false)
  const player = useSiteAudioStore((s) => s.player)

  const skipToNextTrack = useCallback(() => {
    if (isSkippingRef.current) {
      return
    }

    isSkippingRef.current = true

    try {
      if (player && player.stopAllMusicTracks) {
        player.stopAllMusicTracks()
      }

      const ambience = window.__WEBSITE_AMBIENCE__?.advanceToNextTrack

      if (ambience) {
        ambience()
      } else {
        console.warn("Ambience player not initialized")
      }
    } catch (error) {
      console.error("Error skipping track:", error)
    } finally {
      isSkippingRef.current = false
    }
  }, [player])

  return skipToNextTrack
}
