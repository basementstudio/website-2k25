"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { useCurrentScene } from "@/hooks/use-current-scene"

import { useAssets } from "../assets-provider"
import { useInspectable } from "../inspectables/context"
import { IScene } from "./navigation.interface"
import { useNavigationStore } from "./navigation-store"

export const NavigationHandler = () => {
  const pathname = usePathname()
  const { setSelected } = useInspectable()

  const scenes: IScene[] = useAssets().scenes
  const setScenes = useNavigationStore((state) => state.setScenes)

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

  return null
}
