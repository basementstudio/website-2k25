import { useEffect } from "react"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"

export const useTabNavigation = () => {
  const currentScene = useNavigationStore((state) => state.currentScene)
  const isCanvasTabMode = useNavigationStore((state) => state.isCanvasTabMode)
  const currentTabIndex = useNavigationStore((state) => state.currentTabIndex)
  const setCurrentTabIndex = useNavigationStore(
    (state) => state.setCurrentTabIndex
  )
  const setHoverText = useMouseStore((state) => state.setHoverText)

  useEffect(() => {
    if (!isCanvasTabMode || !currentScene) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault()

        const tabs = currentScene.tabs
        if (!tabs.length) return

        const nextIndex = e.shiftKey
          ? (currentTabIndex - 1 + tabs.length) % tabs.length
          : (currentTabIndex + 1) % tabs.length

        setCurrentTabIndex(nextIndex)

        const currentTab = tabs[nextIndex]
        setHoverText(currentTab.tabHoverName)
      }
    }

    window.addEventListener("keydown", handleTabKey)
    return () => window.removeEventListener("keydown", handleTabKey)
  }, [
    isCanvasTabMode,
    currentScene,
    currentTabIndex,
    setCurrentTabIndex,
    setHoverText
  ])

  useEffect(() => {
    if (!isCanvasTabMode) {
      setCurrentTabIndex(-1)
      setHoverText(null)
    }
  }, [isCanvasTabMode, setCurrentTabIndex, setHoverText])
}
