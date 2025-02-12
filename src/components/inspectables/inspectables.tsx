"use client"

import { useEffect, useMemo } from "react"

import { useMesh } from "@/hooks/use-mesh"

import { Inspectable } from "./inspectable"
import { useInspectable } from "./context"
import { useAssets } from "../assets-provider"

export const Inspectables = () => {
  const { inspectableMeshes } = useMesh()
  const { setSelected } = useInspectable()
  const { inspectables } = useAssets()

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
              ?.xOffset
          }
          sizeTarget={
            inspectables.find((inspectable) => inspectable.mesh === mesh.name)
              ?.sizeTarget
          }
        />
      ))}
    </>
  )
}
