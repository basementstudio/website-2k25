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
  const { scenes } = useAssets()
  const scene = useCurrentScene()
  const {
    setScenes,
    setCurrentScene,
    setCurrentTabIndex,
    setIsCanvasTabMode,
    currentScene,
    currentTabIndex,
    isCanvasTabMode
  } = useNavigationStore()
  const { handleNavigation } = useHandleNavigation()

  // Initialize scenes
  useEffect(() => setScenes(scenes), [scenes, setScenes])

  // Handle scene changes based on pathname
  useEffect(() => {
    if (!scenes.length) return

    const newScene =
      pathname === "/"
        ? scenes.find((scene) => scene.name.toLowerCase() === "home")
        : scenes.find((scene) => scene.name === pathname.split("/")[1])

    if (newScene && newScene.name !== scene) {
      setCurrentScene(newScene)
    }
  }, [scenes, pathname, scene, setCurrentScene])

  // Handle tab navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !isCanvasTabMode) return
      if (!currentScene?.tabs?.length) {
        setIsCanvasTabMode(false)
        return
      }

      e.preventDefault()
      const newIndex = e.shiftKey ? currentTabIndex - 1 : currentTabIndex + 1
      setCurrentTabIndex(newIndex)

      if (
        (e.shiftKey && currentTabIndex === 0) ||
        (!e.shiftKey && currentTabIndex === currentScene.tabs.length - 1)
      ) {
        setIsCanvasTabMode(false)
      }
    },
    [
      isCanvasTabMode,
      setCurrentTabIndex,
      currentTabIndex,
      currentScene,
      setIsCanvasTabMode
    ]
  )

  // Handle escape key
  const handleKeyEscape = useCallback(() => {
    if (!isCanvasTabMode || pathname === "/") return

    if (pathname.startsWith("/showcase")) {
      selected ? setSelected(null) : handleNavigation("/")
    } else {
      handleNavigation("/")
    }
  }, [isCanvasTabMode, pathname, selected, setSelected, handleNavigation])

  // Reset selection on pathname change
  useEffect(() => setSelected(null), [pathname, setSelected])

  useEffect(() => {
    if (pathname !== "/" && currentTabIndex !== -1) {
      setCurrentTabIndex(0)
    }
  }, [setCurrentTabIndex, pathname])

  useKeyPress("Tab", handleKeyDown)
  useKeyPress("Escape", handleKeyEscape)

  return null
}
