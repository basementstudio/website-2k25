"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect } from "react"

import { useCurrentScene } from "@/hooks/use-current-scene"

import { useAssets } from "../assets-provider"
import { useInspectable } from "../inspectables/context"
import { IScene } from "./navigation.interface"
import { useNavigationStore } from "./navigation-store"
import { useKeyPress } from "@/hooks/use-key-press"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"

export const NavigationHandler = () => {
  const pathname = usePathname()
  const { setSelected, selected } = useInspectable()
  const scenes: IScene[] = useAssets().scenes
  const scene = useCurrentScene()
  const {
    setScenes,
    setCurrentScene,
    setPreviousTabIndex,
    setCurrentTabIndex,
    previousTabIndex,
    setIsCanvasTabMode,
    currentScene,
    currentTabIndex,
    isCanvasTabMode
  } = useNavigationStore()
  const { handleNavigation } = useHandleNavigation()
  useEffect(() => setScenes(scenes), [scenes, setScenes])

  useEffect(() => {
    if (!scenes.length) return

    setSelected(null)

    const currentScene =
      pathname === "/"
        ? scenes.find((scene) => scene.name.toLowerCase() === "home")
        : scenes.find((scene) => scene.name === pathname.split("/")[1])

    if (currentScene && currentScene.name !== scene)
      setCurrentScene(currentScene)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scenes,
    setSelected,
    setPreviousTabIndex,
    setCurrentTabIndex,
    previousTabIndex
  ])

  useEffect(
    () => setSelected(null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scene]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (!currentScene?.tabs || currentScene.tabs.length === 0) {
          setIsCanvasTabMode(false)
          return
        }

        if (isCanvasTabMode) {
          e.preventDefault()
          const currentIndex = currentTabIndex

          if (e.shiftKey) {
            const newIndex = currentIndex - 1
            setCurrentTabIndex(newIndex)

            if (currentIndex === 0) {
              setCurrentTabIndex(-1)
              setIsCanvasTabMode(false)
            }
          } else {
            const newIndex = currentIndex + 1
            setCurrentTabIndex(newIndex)

            if (
              currentScene.tabs &&
              currentIndex === currentScene.tabs.length - 1
            ) {
              setIsCanvasTabMode(false)
            }
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isCanvasTabMode,
      setCurrentTabIndex,
      currentTabIndex,
      currentScene,
      setIsCanvasTabMode
    ]
  )

  const handleKeyEscape = useCallback(() => {
    if (isCanvasTabMode && pathname !== "/") {
      if (pathname.startsWith("/showcase")) {
        if (selected) {
          setSelected(null)
        } else {
          handleNavigation("/")
        }
      } else {
        handleNavigation("/")
      }
    }
  }, [isCanvasTabMode, pathname, selected, setSelected])

  useKeyPress("Tab", handleKeyDown)
  useKeyPress("Escape", handleKeyEscape)

  return null
}
