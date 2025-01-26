"use client"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { useAssets } from "../assets-provider"
import { IScene } from "./navigation.interface"
import { useNavigationStore } from "./navigation-store"

export const NavigationHandler = () => {
  const pathname = usePathname()

  // Add scenes to store
  const scenes: IScene[] = useAssets().scenes
  const setScenes = useNavigationStore((state) => state.setScenes)
  useEffect(() => {
    setScenes(scenes)
  }, [scenes])

  // Add current scene to store
  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)
  useEffect(() => {
    if (!scenes.length) return

    const currentScene =
      pathname === "/"
        ? scenes.find((scene) => scene.name.toLowerCase() === "home")
        : scenes.find((scene) => scene.name === pathname.split("/")[1])

    if (currentScene) {
      setCurrentScene(currentScene)
    }
  }, [pathname, scenes])

  return <></>
}
