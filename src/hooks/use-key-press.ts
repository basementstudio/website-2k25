import { useEffect } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

export const useKeyPress = (
  key: string,
  callback: (event: KeyboardEvent) => void,
  event: "keydown" | "keyup" = "keydown"
) => {
  // Per-field selector: destructuring the whole store re-rendered every
  // consumer on every navigation-store write.
  const isCanvasTabMode = useNavigationStore((state) => state.isCanvasTabMode)

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
  // Subscription-free: this hook sits at the top of <Scene>, so a store
  // subscription here reconciles the whole Canvas subtree on every
  // navigation-store write (including setCurrentScene inside a tap). The
  // values are only needed at keydown time, so read them off the store then.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return

      const { isCanvasTabMode, currentScene, setCurrentTabIndex } =
        useNavigationStore.getState()

      if (!isCanvasTabMode) {
        if (event.shiftKey && currentScene?.tabs?.length) {
          setCurrentTabIndex(currentScene.tabs.length - 1)
        } else {
          setCurrentTabIndex(0)
        }
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
}
