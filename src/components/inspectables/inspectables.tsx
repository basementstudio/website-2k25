"use client"

import { useMemo } from "react"

import { useMesh } from "@/hooks/use-mesh"

import { Inspectable } from "./inspectable"

export const Inspectables = () => {
  const { inspectableMeshes } = useMesh()

  const positions = useMemo(() => {
    return inspectableMeshes.map((mesh) => ({
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z
    }))
  }, [inspectableMeshes])

  return (
    <>
      {inspectableMeshes.map((mesh, index) => (
        <Inspectable
          key={mesh.name}
          mesh={mesh}
          position={positions[index]}
          id={mesh.name}
        />
      ))}
    </>
  )
}
