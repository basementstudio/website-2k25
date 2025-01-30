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

  useEffect(() => {
    if (!scenes.length) return

    setSelected(null)
  }, [pathname, scenes, setSelected])

  return null
}
