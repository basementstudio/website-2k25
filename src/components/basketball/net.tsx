import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"
import { useEffect, useRef } from "react"

import { Mesh, MeshStandardMaterial } from "three"

interface NetProps {
  mesh: Mesh
}

export const Net = ({ mesh }: NetProps) => {
  const meshRef = useRef<Mesh | null>(null)

  useEffect(() => {
    if (!mesh) return
    const mat = mesh.material as MeshStandardMaterial
    console.log("mesh", mesh)

    meshRef.current = mesh
    meshRef.current.material = createGlobalShaderMaterial(mat, false)
  }, [mesh])

  return meshRef.current ? <primitive object={meshRef.current} /> : null
}
