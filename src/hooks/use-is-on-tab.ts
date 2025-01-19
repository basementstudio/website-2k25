import { useCallback, useEffect, useState } from "react"

export const useIsOnTab = () => {
  const [visibilityState, setVisibilityState] = useState(true)

  const handleVisibilityChange = useCallback(() => {
    setVisibilityState(document.visibilityState === "visible")
  }, [])

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  return visibilityState
}
