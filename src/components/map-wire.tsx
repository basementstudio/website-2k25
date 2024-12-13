"use client"

import { useGLTF } from "@react-three/drei"
import { memo, useMemo } from "react"
import { Mesh, MeshStandardMaterial } from "three"

import { createShaderMaterial } from "@/shaders/custom-shader-material"

import { GLTFResult } from "./map"

export const MapWire = memo(MapWireInner)

function MapWireInner() {
  const { nodes } = useGLTF("/models/map-wire.glb") as unknown as GLTFResult
  const material = useMemo(() => {
    return createShaderMaterial(
      (nodes.WireFrame_MeshCurveMesh as Mesh).material as MeshStandardMaterial,
      null,
      true
    )
  }, [nodes.WireFrame_MeshCurveMesh])

  return (
    <group dispose={null} name="map-wire">
      <lineSegments
        geometry={(nodes.WireFrame_MeshCurveMesh as Mesh).geometry}
        material={material}
      />
    </group>
  )
}

useGLTF.preload("/models/map-wire.glb")
