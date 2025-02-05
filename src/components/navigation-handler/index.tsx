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
  const { setSelected } = useInspectable()
  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)
  const setScenes = useNavigationStore((state) => state.setScenes)
  const scenes: IScene[] = useAssets().scenes
  const { handleNavigation } = useHandleNavigation()
  const scene = useCurrentScene()

  useEffect(() => setScenes(scenes), [scenes, setScenes])

  const setPreviousTabIndex = useNavigationStore(
    (state) => state.setPreviousTabIndex
  )
  const previousTabIndex = useNavigationStore((state) => state.previousTabIndex)
  const setCurrentTabIndex = useNavigationStore(
    (state) => state.setCurrentTabIndex
  )

  useEffect(() => setScenes(scenes), [scenes, setScenes])

  useEffect(() => {
    if (!scenes.length) return

    setSelected(null)

    const homeScene = scenes.find(
      (scene) => scene.name.toLowerCase() === "home"
    )

    if (pathname === "/" && homeScene?.tabs) {
      if (previousTabIndex !== -1) {
        const matchingTabIndex = homeScene.tabs.findIndex(
          (tab) =>
            tab.tabClickableName ===
            homeScene.tabs[previousTabIndex]?.tabClickableName
        )
        setCurrentTabIndex(matchingTabIndex !== -1 ? matchingTabIndex : 0)
      } else {
        setCurrentTabIndex(0)
      }
    } else if (pathname !== "/" && homeScene?.tabs) {
      const tabIndex = homeScene.tabs.findIndex((tab) =>
        pathname.startsWith(`/${tab.tabRoute.toLowerCase()}`)
      )
      if (tabIndex !== -1) setPreviousTabIndex(tabIndex)
    }

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

  useKeyPress(
    "Escape",
    useCallback(() => {
      if (pathname === "/" || !scenes || window.scrollY > window.innerHeight)
        return

      if (
        scene === "services" ||
        scene === "blog" ||
        scene === "people" ||
        scene === "basketball" ||
        scene === "lab" ||
        scene === "showcase"
      ) {
        handleNavigation("/")
      }
    }, [scene, handleNavigation, pathname, scenes])
  )

  useEffect(
    () => setSelected(null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scene]
  )

  return null
}
