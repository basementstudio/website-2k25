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

  const handleLoad = useCallback(() => {
    setVisibilityState(true)
  }, [])

  const handleUnload = useCallback(() => {
    setVisibilityState(false)
  }, [])

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange, {
      passive: true
    })

    // Handle Safari iOS app switching
    if (isSafariIOS()) {
      window.addEventListener("load", handleLoad, {
        passive: true
      })
      window.addEventListener("unload", handleUnload, {
        passive: true
      })
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (isSafariIOS()) {
        window.removeEventListener("load", handleLoad)
        window.removeEventListener("unload", handleUnload)
      }
    }
  }, [handleVisibilityChange, handleUnload])

  return visibilityState
}
