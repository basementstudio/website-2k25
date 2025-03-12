import { useEffect } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

export const useKeyPress = (
  key: string,
  callback: (event: KeyboardEvent) => void,
  event: "keydown" | "keyup" = "keydown"
) => {
  const { isCanvasTabMode } = useNavigationStore()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === key) callback(event)
    }

    window.addEventListener(event, handler, { passive: true })

    return () => window.removeEventListener(event, handler)
  }, [key, callback, event, isCanvasTabMode])
}
