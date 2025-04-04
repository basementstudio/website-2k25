import { useCallback } from "react"

export function useScrollControl() {
  const disableScroll = useCallback(() => {
    document.body.style.overflow = "hidden"
  }, [])

  const enableScroll = useCallback(() => {
    document.body.style.overflow = "" // Reset to default
  }, [])

  return { disableScroll, enableScroll }
}
