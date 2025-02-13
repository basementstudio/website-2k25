"use client"

import { useEffect } from "react"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"

import { useInspectable } from "./context"
import { Inspectable } from "./inspectable"

export const Inspectables = () => {
  const { inspectableMeshes } = useMesh()
  const { setSelected } = useInspectable()
  const { inspectables } = useAssets()
  const scene = useCurrentScene()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) setSelected(null)
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [setSelected])

  useEffect(() => setSelected(null), [scene, setSelected])

  return (
    <>
      {inspectableMeshes.map((mesh) => {
        const inspectable = inspectables.find(
          (inspectable) => inspectable.mesh === mesh.name
        )

        if (!inspectable) return null

        return (
          <Inspectable
            key={mesh.name}
            id={mesh.name}
            mesh={mesh}
            position={mesh.userData.position}
            xOffset={inspectable.xOffset}
            sizeTarget={inspectable.sizeTarget}
            scenes={inspectable.scenes}
          />
        )
      })}
    </>
  )
}
