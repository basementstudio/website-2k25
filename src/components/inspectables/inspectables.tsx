"use client"

import { memo, useEffect } from "react"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"

import { useInspectable } from "./context"
import { Inspectable } from "./inspectable"

export const Inspectables = memo(function InspectablesInner() {
  const { inspectableMeshes } = useMesh()
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
      {inspectableMeshes.map((mesh) => {
        const inspectableConfig = inspectables.find(
          (inspectable) => inspectable.mesh === mesh.name
        )

        if (!inspectableConfig) return null

        return (
          <Inspectable
            key={mesh.name}
            id={mesh.name}
            xOffset={inspectableConfig.xOffset}
            yOffset={inspectableConfig.yOffset}
            xRotationOffset={inspectableConfig.xRotationOffset}
            sizeTarget={inspectableConfig.sizeTarget}
            scenes={inspectableConfig.scenes}
          />
        )
      })}
    </>
  )
})
