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

  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)

  useEffect(() => {
    const currentScene =
      pathname === "/"
        ? scenes.find((scene) => scene.name.toLowerCase() === "home")
        : scenes.find((scene) => scene.name === pathname.split("/")[1])

    if (currentScene) setCurrentScene(currentScene)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes])

  useEffect(
    () => setSelected(null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scene]
  )

  return null
}
