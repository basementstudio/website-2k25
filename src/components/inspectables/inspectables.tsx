"use client"

import { useEffect, useMemo } from "react"

import { useMesh } from "@/hooks/use-mesh"

import { Inspectable } from "./inspectable"
import { useInspectable } from "./context"
import { useAssets } from "../assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"

export const Inspectables = () => {
  const { inspectableMeshes } = useMesh()
  const { setSelected } = useInspectable()
  const { inspectables } = useAssets()
  const scene = useCurrentScene()

  const positions = useMemo(() => {
    return inspectableMeshes.map((mesh) => ({
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z
    }))
  }, [inspectableMeshes])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) setSelected(null)
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [setSelected])

  useEffect(() => setSelected(null), [scene])

  return (
    <>
      {inspectableMeshes.map((mesh, index) => (
        <Inspectable
          key={mesh.name}
          mesh={mesh}
          position={positions[index]}
          id={mesh.name}
          xOffset={
            inspectables.find((inspectable) => inspectable.mesh === mesh.name)
              ?.xOffset ?? 0
          }
          sizeTarget={
            inspectables.find((inspectable) => inspectable.mesh === mesh.name)
              ?.sizeTarget ?? 0.5
          }
          scenes={
            inspectables.find((inspectable) => inspectable.mesh === mesh.name)
              ?.scenes ?? []
          }
        />
      ))}
    </>
  )
}
