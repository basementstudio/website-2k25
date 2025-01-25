"use client"
import { useEffect } from "react"
import { useAssets } from "../assets-provider"
import { useNavigationStore } from "./navigation-store"
import { IScene } from "./navigation.interface"

export const NavigationHandler = () => {
  const scenes: IScene[] = useAssets().scenes
  const setScenes = useNavigationStore((state) => state.setScenes)

  useEffect(() => {
    setScenes(scenes)
  }, [scenes])

  console.log(scenes)
  return <></>
}
