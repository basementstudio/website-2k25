"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo } from "react"

import { useCurrentScene } from "@/hooks/use-current-scene"

import { useAssets } from "../assets-provider"
import { useInspectable } from "../inspectables/context"
import { useNavigationStore } from "./navigation-store"
import { useKeyPress } from "@/hooks/use-key-press"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"

export const NavigationHandler = () => {
  const pathname = usePathname()
  const { setSelected } = useInspectable()

  const {
    setScenes,
    isCanvasTabMode,
    setIsCanvasTabMode,
    currentScene,
    setCurrentScene,
    currentTabIndex,
    setCurrentTabIndex
  } = useNavigationStore()

  const { scenes } = useAssets()
  const { handleNavigation } = useHandleNavigation()
  const scene = useCurrentScene()

  useEffect(() => setScenes(scenes), [scenes, setScenes])

  const findCurrentScene = useMemo(() => {
    if (!scenes.length) return null
    return pathname === "/"
      ? scenes.find((scene) => scene.name.toLowerCase() === "home")
      : scenes.find((scene) => scene.name === pathname.split("/")[1])
  }, [scenes, pathname])

  useEffect(() => {
    if (!scenes.length) return
    setSelected(null)

    if (findCurrentScene && findCurrentScene.name !== scene) {
      setCurrentScene(findCurrentScene)
    }
  }, [findCurrentScene, scene, scenes.length, setSelected, setCurrentScene])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !isCanvasTabMode) return
      if (!currentScene?.tabs?.length) {
        setIsCanvasTabMode(false)
        return
      }

      e.preventDefault()
      const maxIndex = currentScene.tabs.length - 1
      let newIndex = e.shiftKey ? currentTabIndex - 1 : currentTabIndex + 1

      if (newIndex < 0 || newIndex > maxIndex) {
        setIsCanvasTabMode(false)
        newIndex = newIndex < 0 ? 0 : maxIndex
      }

      setCurrentTabIndex(newIndex)
    },
    [
      isCanvasTabMode,
      setCurrentTabIndex,
      currentTabIndex,
      currentScene,
      setIsCanvasTabMode
    ]
  )

  const handleEscape = useCallback(() => {
    if (pathname === "/" || !scenes || window.scrollY > window.innerHeight)
      return

    const trimmedPathname = pathname.replace("/", "")
    const tabIndex = scenes[0].tabs.findIndex(
      (tab) => tab.tabName.toLowerCase() === trimmedPathname
    )

    if (
      ["services", "blog", "people", "basketball", "lab", "showcase"].includes(
        scene
      )
    ) {
      handleNavigation("/")
      setCurrentTabIndex(tabIndex)
    }
  }, [scene, handleNavigation, pathname, scenes, setCurrentTabIndex])

  useEffect(() => {
    if (pathname !== "/" && currentTabIndex !== -1) {
      setCurrentTabIndex(0)
    }
  }, [setCurrentTabIndex, pathname, currentTabIndex])

  useEffect(() => setSelected(null), [scene, setSelected])

  useKeyPress("Tab", handleKeyDown)
  useKeyPress("Escape", handleEscape)

  return null
}
