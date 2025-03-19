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
      if (event.key === key) {
        if (key === "Tab" && isCanvasTabMode) {
          event.preventDefault()
          callback(event)
        } else if (key !== "Tab") {
          callback(event)
        }
      }
    }

    window.addEventListener(event, handler, { passive: key !== "Tab" })

    return () => window.removeEventListener(event, handler)
  }, [key, callback, event, isCanvasTabMode])
}

export const useTabKeyHandler = () => {
  const { setCurrentTabIndex, isCanvasTabMode, currentScene } =
    useNavigationStore()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Tab" && !isCanvasTabMode) {
        if (event.shiftKey && currentScene?.tabs?.length) {
          setCurrentTabIndex(currentScene.tabs.length - 1)
        } else {
          setCurrentTabIndex(0)
        }
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [currentScene, isCanvasTabMode, setCurrentTabIndex])
}
