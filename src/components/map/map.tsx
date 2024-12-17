"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame, useLoader } from "@react-three/fiber"
import { memo, useEffect, useMemo, useState } from "react"
import {
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  NoColorSpace,
  Object3D,
  Object3DEventMap,
  Texture
} from "three"
import { EXRLoader, GLTF } from "three/examples/jsm/Addons.js"

import { CLICKABLE_NODES } from "@/constants/clickable-elements"
import {
  createShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/custom-shader-material"

import { useAssets } from "../assets-provider"
import { RoutingElement } from "../routing-element"
import { LightmapLoader } from "./lightmaps"

export type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh
  }
}

export const Map = memo(InnerMap)

function useLightmaps(): Record<string, Texture> {
  const { lightmaps } = useAssets()

  const loadedMaps = useLoader(
    EXRLoader,
    lightmaps.map((lightmap) => lightmap.url)
  )

  const lightMaps = useMemo(() => {
    return loadedMaps.reduce(
      (acc, map, index) => {
        console.log(map)

        map.flipY = true
        map.magFilter = NearestFilter
        map.colorSpace = NoColorSpace
        acc[lightmaps[index].mesh] = map
        return acc
      },
      {} as Record<string, Texture>
    )
  }, [lightmaps, loadedMaps])

  return lightMaps
}

function InnerMap() {
  const { map } = useAssets()
  const { scene } = useGLTF(map) as unknown as GLTFResult

  const [mainScene, setMainScene] = useState<Object3D<Object3DEventMap> | null>(
    null
  )

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})

  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  useFrame(({ clock }) => {
    Object.values(shaderMaterialsRef).forEach((material) => {
      material.uniforms.uTime.value = clock.getElapsedTime()
    })
  })

  useEffect(() => {
    const routingNodes: Record<string, Mesh> = {}

    CLICKABLE_NODES.forEach((node) => {
      const child = scene.getObjectByName(`${node.name}`)
      if (child) {
        child.removeFromParent()
        routingNodes[node.name] = child as Mesh
      }
    })

    // Replace materials
    scene.traverse((child) => {
      if ("isMesh" in child) {
        const meshChild = child as Mesh

        const ommitNode = Boolean(
          CLICKABLE_NODES.find((n) => n.name === meshChild.name)?.name
        )
        if (ommitNode) return
        const alreadyReplaced = meshChild.userData.hasGlobalMaterial

        if (alreadyReplaced) return

        const currentMaterial = meshChild.material
        const newMaterials = Array.isArray(currentMaterial)
          ? currentMaterial.map((material) =>
              createShaderMaterial(material as MeshStandardMaterial, false)
            )
          : createShaderMaterial(currentMaterial as MeshStandardMaterial, false)

        meshChild.material = newMaterials

        meshChild.userData.hasGlobalMaterial = true
      }
    })

    setMainScene(scene)

    // Split the routing nodes

    setRoutingNodes((current) => ({
      ...current,
      ...routingNodes
    }))
  }, [scene])

  if (!mainScene) return null

  return (
    <group>
      <primitive object={mainScene} />
      {Object.values(routingNodes).map((node) => (
        <RoutingElement key={node.name} node={node} />
      ))}
      <LightmapLoader />
    </group>
  )
}
