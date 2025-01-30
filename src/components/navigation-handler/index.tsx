"use client"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { useAssets } from "../assets-provider"
import { useInspectable } from "../inspectables/context"
import { IScene } from "./navigation.interface"
import { useNavigationStore } from "./navigation-store"

export const NavigationHandler = () => {
  const pathname = usePathname()
  const { setSelected } = useInspectable()

  const scenes: IScene[] = useAssets().scenes
  const setScenes = useNavigationStore((state) => state.setScenes)

  useEffect(() => setScenes(scenes), [scenes, setScenes])

  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)

  useEffect(() => {
    if (!scenes.length) return

    setSelected(null)

    const currentScene =
      pathname === "/"
        ? scenes.find((scene) => scene.name.toLowerCase() === "home")
        : scenes.find((scene) => scene.name === pathname.split("/")[1])

    if (currentScene) setCurrentScene(currentScene)
  }, [pathname, scenes, setSelected, setCurrentScene])

  return null
}
