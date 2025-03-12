"use client"

import { memo, useEffect } from "react"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"

import { useInspectable } from "./context"
import { Inspectable } from "./inspectable"

export const Inspectables = memo(function InspectablesInner() {
  const { setSelected } = useInspectable()
  const { inspectables } = useAssets()
  const scene = useCurrentScene()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) setSelected(null)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [setSelected])

  useEffect(() => setSelected(null), [scene, setSelected])

  return (
    <>
      {inspectables.map((inspectableConfig) => {
        return (
          <Inspectable
            key={inspectableConfig.mesh}
            id={inspectableConfig.mesh}
          />
        )
      })}
    </>
  )
})
