"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect } from "react"

import { useCurrentScene } from "@/hooks/use-current-scene"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useKeyPress } from "@/hooks/use-key-press"

import { useAssets } from "../assets-provider"
import { useInspectable } from "../inspectables/context"
import { IScene } from "./navigation.interface"
import { useNavigationStore } from "./navigation-store"
import { useArcadeStore } from "@/store/arcade-store"

export const NavigationHandler = () => {
  const pathname = usePathname()
  const { setSelected } = useInspectable()

  const setScenes = useNavigationStore((state) => state.setScenes)
  const {
    isCanvasTabMode,
    setIsCanvasTabMode,
    currentScene,
    setCurrentScene,
    currentTabIndex
  } = useNavigationStore()
  const scenes: IScene[] = useAssets().scenes
  const { handleNavigation } = useHandleNavigation()
  const scene = useCurrentScene()

  useEffect(() => setScenes(scenes), [scenes, setScenes])

  const setCurrentTabIndex = useNavigationStore(
    (state) => state.setCurrentTabIndex
  )

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
  }, [scenes, setSelected, setCurrentTabIndex])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !isCanvasTabMode) return

      if (!currentScene?.tabs?.length) {
        setIsCanvasTabMode(false)
        return
      }

      e.preventDefault()
      const isInLabTab = useArcadeStore.getState().isInLabTab
      const setIsInLabTab = useArcadeStore.getState().setIsInLabTab

      // If we're in the lab route
      if (pathname === "/lab") {
        // Handle forward tab on first tab
        if (!e.shiftKey && currentTabIndex === 0) {
          if (!isInLabTab) {
            setIsInLabTab(true)
            setCurrentTabIndex(-1)
            return
          }
        }

        // Handle forward tab from lab tab
        if (!e.shiftKey && currentTabIndex === -1 && isInLabTab) {
          setIsInLabTab(false)
          setCurrentTabIndex(1)
          return
        }

        // Handle shift+tab into lab tab
        if (e.shiftKey && currentTabIndex === 1) {
          setIsInLabTab(true)
          setCurrentTabIndex(-1)
          return
        }

        // Handle shift+tab out of lab tab
        if (e.shiftKey && currentTabIndex === -1 && isInLabTab) {
          setIsInLabTab(false)
          setCurrentTabIndex(0)
          return
        }
      }

      const newIndex = e.shiftKey ? currentTabIndex - 1 : currentTabIndex + 1

      // add boundaries
      if (newIndex < 0 || newIndex >= currentScene.tabs.length) {
        setIsCanvasTabMode(false)
        setIsInLabTab(false)
        return
      }

      setCurrentTabIndex(newIndex)

      if (
        (e.shiftKey && currentTabIndex === 0) ||
        (!e.shiftKey && currentTabIndex === currentScene.tabs.length - 1)
      ) {
        setIsCanvasTabMode(false)
        setIsInLabTab(false)
      }
    },
    [
      isCanvasTabMode,
      setCurrentTabIndex,
      currentTabIndex,
      currentScene,
      setIsCanvasTabMode,
      pathname
    ]
  )

  useEffect(() => {
    if (pathname !== "/" && currentTabIndex !== -1) {
      setCurrentTabIndex(0)
    }
  }, [setCurrentTabIndex, pathname])

  useEffect(() => setSelected(null), [setSelected])

  useKeyPress("Tab", handleKeyDown)
  useKeyPress(
    "Escape",
    useCallback(() => {
      if (pathname === "/" || !scenes || window.scrollY > window.innerHeight)
        return

      const trimmedPathname = pathname.replace("/", "")
      const tabIndex = scenes[0].tabs.findIndex(
        (tab) => tab.tabName.toLowerCase() === trimmedPathname
      )

      if (
        scene === "services" ||
        scene === "blog" ||
        scene === "people" ||
        scene === "basketball" ||
        scene === "lab" ||
        scene === "showcase"
      ) {
        handleNavigation("/")
        setCurrentTabIndex(tabIndex)
      }
    }, [scene, handleNavigation, pathname, scenes, setCurrentTabIndex])
  )

  return null
}
