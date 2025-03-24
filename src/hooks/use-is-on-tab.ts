import { useCallback, useEffect, useState } from "react"

const isSafariIOS = () => {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua)
}

export const useIsOnTab = () => {
  const [visibilityState, setVisibilityState] = useState(true)

  const handleVisibilityChange = useCallback(() => {
    setVisibilityState(document.visibilityState === "visible")
  }, [])

  const handlePageShow = useCallback(() => {
    setVisibilityState(true)
  }, [])

  const handlePageHide = useCallback(() => {
    setVisibilityState(false)
  }, [])

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange, {
      passive: true
    })

    // Handle Safari iOS app switching
    if (isSafariIOS()) {
      window.addEventListener("pageshow", handlePageShow, {
        passive: true
      })
      window.addEventListener("pagehide", handlePageHide, {
        passive: true
      })
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (isSafariIOS()) {
        window.removeEventListener("pageshow", handlePageShow)
        window.removeEventListener("pagehide", handlePageHide)
      }
    }
  }, [handleVisibilityChange, handlePageShow, handlePageHide])

  return visibilityState
}
